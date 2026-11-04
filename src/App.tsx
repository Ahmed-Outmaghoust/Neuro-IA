import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  RotateCcw,
  Sparkle,
} from 'lucide-react'
import { Stage } from './stageshow/stage'
import type { Script } from './stageshow/act'
import {
  classify,
  cloneParameters,
  forward,
  measureModel,
  resetNetwork,
  runNeuron,
  TRAINING_EXAMPLES,
  trainEpoch,
  type NetworkParameters,
  type Pair,
} from './neural/network'
import {
  hasChosenImportance,
  hasRescuedNetwork,
  importanceScore,
  resetImportanceChallenge,
  resetRescueChallenge,
  rescuePredictions,
  type SliderChallenge,
} from './games/challenges'
import './styles.css'

const ARABIC = new Intl.NumberFormat('ar', { maximumFractionDigits: 2 })
const PERCENT = new Intl.NumberFormat('ar', { style: 'percent', maximumFractionDigits: 0 })
const number = (value: number) => ARABIC.format(value)
const percent = (value: number) => PERCENT.format(value)
const fillMeter = (value: number): CSSProperties => ({ '--fill': `${Math.min(1, Math.max(0, value))}` } as CSSProperties)
const signalStory: Script<{ flowing: boolean }> = async (act) => {
  await act.wait(400)
  await act.set({ flowing: true })
  await act.wait(2400)
  await act.set({ flowing: false })
}

const CHAPTERS = [
  { title: 'هل تستطيع الآلة أن تتعلّم؟', short: 'البداية', time: 'دقيقة' },
  { title: 'عصبون صغير... قرار كبير!', short: 'العصبون', time: 'دقيقتان' },
  { title: 'ماذا يحدث عندما تتعاون العصبونات؟', short: 'الشبكة', time: 'دقيقتان' },
  { title: 'الخطأ هو بداية التعلّم!', short: 'التدريب', time: 'دقيقتان' },
  { title: 'الآن جاء دورك!', short: 'التحديات', time: '٣ دقائق' },
]

type AnimatedTraining = {
  start: NetworkParameters
  epochs: number
  rate: number
  update: (parameters: NetworkParameters) => void
  done: (parameters: NetworkParameters) => void
}

function useAnimatedTraining() {
  const [running, setRunning] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const run = ({ start, epochs, rate, update, done }: AnimatedTraining) => {
    if (timer.current) window.clearTimeout(timer.current)
    let current = cloneParameters(start)
    let step = 0
    setRunning(true)
    const tick = () => {
      current = trainEpoch(current, TRAINING_EXAMPLES, rate)
      step += 1
      update(current)
      if (step >= epochs) {
        setRunning(false)
        done(current)
        timer.current = undefined
        return
      }
      timer.current = window.setTimeout(tick, 24)
    }
    timer.current = window.setTimeout(tick, 80)
  }
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])
  return { running, run }
}

function App() {
  const [chapter, setChapter] = useState(0)
  const [catChoice, setCatChoice] = useState<'قطة' | 'كلب' | null>(null)
  const [neuronWeights, setNeuronWeights] = useState([0.55, 0.55, -0.75])
  const neuronInputs = [0.85, 0.7, 0.35]
  const neuronScore = runNeuron(neuronInputs, neuronWeights, -0.2)
  const [networkInputs, setNetworkInputs] = useState<Pair>([0.85, 0.22])
  const [chapterParameters, setChapterParameters] = useState<NetworkParameters>(() => resetNetwork())
  const [chapterEpoch, setChapterEpoch] = useState(0)
  const [learningRate, setLearningRate] = useState(0.45)
  const chapterTraining = useAnimatedTraining()
  const [gameIndex, setGameIndex] = useState(0)
  const [importance, setImportance] = useState<SliderChallenge>(() => resetImportanceChallenge())
  const [gameParameters, setGameParameters] = useState<NetworkParameters>(() => resetNetwork())
  const [gameRate, setGameRate] = useState(0.45)
  const gameTraining = useAnimatedTraining()
  const [rescue, setRescue] = useState<SliderChallenge>(() => resetRescueChallenge())
  const [wonGames, setWonGames] = useState([false, false, false])
  const chapterSection = useRef<HTMLElement>(null)
  const allGamesWon = wonGames.every(Boolean)
  const chapterMetrics = measureModel(chapterParameters, TRAINING_EXAMPLES)
  const gameMetrics = measureModel(gameParameters, TRAINING_EXAMPLES)

  const markWon = (index: number) => {
    setWonGames((current) => current.map((won, i) => i === index ? true : won))
  }
  const goToChapter = (index: number) => {
    setChapter(index)
    requestAnimationFrame(() => chapterSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const updateWeight = (index: number, value: number) => setNeuronWeights((weights) => weights.map((weight, i) => i === index ? value : weight))
  const updateImportanceWeight = (index: number, value: number) => {
    setImportance((current) => ({ ...current, weights: current.weights.map((weight, i) => i === index ? value : weight) }))
  }
  const updateRescueWeight = (index: number, value: number) => {
    setRescue((current) => ({ ...current, weights: current.weights.map((weight, i) => i === index ? value : weight) }))
  }
  const beginChapterTraining = () => {
    if (chapterTraining.running) return
    setChapterEpoch(0)
    chapterTraining.run({
      start: chapterParameters,
      epochs: 80,
      rate: learningRate,
      update: (parameters) => {
        setChapterParameters(parameters)
        setChapterEpoch((epoch) => epoch + 1)
      },
      done: setChapterParameters,
    })
  }
  const beginGameTraining = () => {
    if (gameTraining.running) return
    gameTraining.run({
      start: gameParameters,
      epochs: 120,
      rate: gameRate,
      update: setGameParameters,
      done: (parameters) => {
        setGameParameters(parameters)
        if (measureModel(parameters, TRAINING_EXAMPLES).mistakes <= 1) markWon(1)
      },
    })
  }

  const selectChapter = (index: number) => goToChapter(index)

  return (
    <div className="app-shell" dir="rtl">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="نَسَق، إلى بداية الرحلة">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><b /><b /></span>
          <span>نَسَق</span>
        </a>
        <div className="header-note"><span className="status-light" /> تجربة تفاعلية · ٧ دقائق</div>
        <a className="header-link" href="#journey">مسار التعلّم <ArrowLeft size={16} aria-hidden="true" /></a>
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> استوديو الشبكات العصبية</p>
            <h1 id="hero-title">من إشارة صغيرة<br />إلى <span>فكرة ذكية.</span></h1>
            <p className="hero-description">اكتشف كيف تتعلّم الآلة من الأمثلة، خطوةً خطوة. لا تحتاج إلى خبرة سابقة — فقط جرّب ولاحظ ما يتغيّر.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => selectChapter(0)}>ابدأ الرحلة <ArrowLeft size={17} /></button>
              <span className="hero-duration"><Compass size={16} /> خمس محطات قصيرة</span>
            </div>
            <div className="hero-proof"><span className="proof-dot" /> كل حركة هنا تغيّر حساباً حقيقياً</div>
          </div>
          <div className="hero-art" aria-label="رسم تفاعلي لمسار إشارات بين مدخلات وعصبونات وقرار">
            <NetworkDiagram parameters={chapterParameters} inputs={networkInputs} active={chapterTraining.running || gameTraining.running ? true : undefined} compactLabel="تنبؤ أوليّ" animate />
            <div className="art-caption"><span>الإشارة</span><span className="caption-track" /><span>التوقّع</span></div>
            <div className="art-index"><span>٠١</span><span>←</span><span>٠٥</span></div>
          </div>
          <div className="hero-bottomline"><span>مفاهيم الذكاء الاصطناعي، بلغة بسيطة</span><span className="hero-bottom-line" /><span>صُمّم للفضوليّين</span></div>
        </section>

        <section className="journey-section" id="journey" aria-label="محطات التعلّم">
          <div className="journey-head">
            <div><p className="eyebrow"><span className="eyebrow-line" /> رحلتك في خمس محطات</p><h2>تعلّمها بالتجربة.</h2></div>
            <div className="journey-time"><span>الوقت المتوقّع</span><strong>٥–١٠ دقائق</strong></div>
          </div>
          <nav className="chapter-nav" aria-label="اختر محطة">
            {CHAPTERS.map((item, index) => (
              <button key={item.short} className={`chapter-tab ${chapter === index ? 'is-current' : ''} ${index < chapter || (index === 4 && allGamesWon) ? 'is-done' : ''}`} onClick={() => selectChapter(index)} aria-current={chapter === index ? 'step' : undefined}>
                <span className="tab-number">{index < chapter || (index === 4 && allGamesWon) ? <Check size={14} /> : number(index + 1)}</span>
                <span className="tab-copy"><b>{item.short}</b><small>{item.time}</small></span>
              </button>
            ))}
          </nav>
          <div className="journey-progress" role="progressbar" aria-label="التقدّم في الرحلة" aria-valuemin={0} aria-valuemax={5} aria-valuenow={allGamesWon ? 5 : chapter}>
            <span style={fillMeter((allGamesWon ? 100 : chapter * 20) / 100)} />
          </div>
        </section>

        <section className="chapter-section" ref={chapterSection} aria-labelledby="chapter-title" key={chapter}>
          <div className="chapter-intro">
            <div className="chapter-overline"><span>المحطة {number(chapter + 1)} من ٥</span><span className="chapter-estimate">{CHAPTERS[chapter]?.time}</span></div>
            <h2 id="chapter-title">{CHAPTERS[chapter]?.title}</h2>
            <p>{chapterLead(chapter)}</p>
          </div>
          <div className="chapter-workbench">
            {chapter === 0 && (
              <FirstChapter choice={catChoice} onChoose={(choice) => setCatChoice(choice)} onNext={() => selectChapter(1)} />
            )}
            {chapter === 1 && (
              <NeuronChapter score={neuronScore} weights={neuronWeights} onWeight={updateWeight} onReset={() => setNeuronWeights([0.55, 0.55, -0.75])} onNext={() => selectChapter(2)} />
            )}
            {chapter === 2 && (
              <NetworkChapter parameters={chapterParameters} inputs={networkInputs} onInput={(index, value) => setNetworkInputs((current) => index === 0 ? [value, current[1]] : [current[0], value])} onReset={() => setNetworkInputs([0.85, 0.22])} onNext={() => selectChapter(3)} />
            )}
            {chapter === 3 && (
              <TrainingChapter parameters={chapterParameters} metrics={chapterMetrics} epochs={chapterEpoch} rate={learningRate} running={chapterTraining.running} onRate={setLearningRate} onTrain={beginChapterTraining} onReset={() => { setChapterParameters(resetNetwork()); setChapterEpoch(0) }} onNext={() => selectChapter(4)} />
            )}
            {chapter === 4 && (
              <GamesChapter
                gameIndex={gameIndex}
                wonGames={wonGames}
                allGamesWon={allGamesWon}
                importance={importance}
                importanceScore={importanceScore(importance)}
                gameParameters={gameParameters}
                gameMetrics={gameMetrics}
                gameRate={gameRate}
                gameTraining={gameTraining.running}
                rescue={rescue}
                rescueScores={rescuePredictions(rescue)}
                onGame={setGameIndex}
                onImportance={updateImportanceWeight}
                onImportanceReset={() => { setImportance(resetImportanceChallenge()); setWonGames((wins) => wins.map((won, index) => index === 0 ? false : won)) }}
                onImportanceWin={() => markWon(0)}
                onGameRate={setGameRate}
                onGameTrain={beginGameTraining}
                onGameReset={() => { setGameParameters(resetNetwork()); setWonGames((wins) => wins.map((won, index) => index === 1 ? false : won)) }}
                onGameWin={() => markWon(1)}
                onRescue={updateRescueWeight}
                onRescueReset={() => { setRescue(resetRescueChallenge()); setWonGames((wins) => wins.map((won, index) => index === 2 ? false : won)) }}
                onRescueWin={() => markWon(2)}
                onCelebrate={() => setGameIndex(3)}
              />
            )}
          </div>
          {chapter < 4 && <div className="chapter-footnote"><CircleHelp size={15} /><span>جرّب بحرية؛ لا توجد إجابة تعاقبك هنا.</span><span className="footnote-rule" /><span>{number(chapter + 1)} / ٥</span></div>}
        </section>

        <section className="takeaway-strip" aria-label="ما ستتعلمه">
          <div className="takeaway-title"><span className="eyebrow-line" /><span>الفكرة الكبيرة</span></div>
          <p>معلومة تدخل، إشارات تتعاون، توقّع يظهر — ثم يتعلّم النموذج من خطئه.</p>
          <button className="text-button" onClick={() => selectChapter(4)}>جرّب بنفسك <ArrowLeft size={15} /></button>
        </section>

        <footer className="site-footer">
          <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><b /><b /></span><span>نَسَق</span></a>
          <span>الشبكة لا تفكّر مثل الإنسان؛ إنّها تتعلّم أنماطاً من الأمثلة.</span>
          <button className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>العودة إلى البداية <ArrowRight size={15} /></button>
        </footer>
      </main>
    </div>
  )
}

function chapterLead(chapter: number) {
  return [
    'الهاتف لا يرى الصورة كما نراها نحن. لكنّه يستطيع تعلّم علامات تتكرّر في صور القطط والكلاب.',
    'تخيّل أنك تقرّر الخروج. تنظر إلى صفاء السماء والحرارة واحتمال المطر؛ وبعضها أهمّ من بعض.',
    'عصبون واحد يلاحظ علامة بسيطة. وحين تتبادل العصبونات الإشارات، تظهر صورة أوضح.',
    'في البداية قد تخطئ الشبكة. نقيس أخطاءها، ثم نسمح لها بتعديل أوزانها من الأمثلة.',
    'ثلاث ألعاب قصيرة. استخدم ما لاحظته لتوجّه الشبكة نحو النتيجة التي تريدها.',
  ][chapter] ?? ''
}

function FirstChapter({ choice, onChoose, onNext }: { choice: 'قطة' | 'كلب' | null; onChoose: (choice: 'قطة' | 'كلب') => void; onNext: () => void }) {
  const correct = choice === 'قطة'
  return (
    <div className="first-layout">
      <div className="experiment-copy">
        <span className="section-kicker">تجربة سريعة · ١٥ ثانية</span>
        <h3>ما النمط الذي تراه؟</h3>
        <p>هذه الصورة تحمل ميزتين لاحظتهما الشبكة في أمثلة سابقة. إلى أي مجموعة تُلحقها؟</p>
        <div className="feature-pair" aria-label="علامتان في الصورة">
          <FeatureValue label="أذنان مدبّبتان" value={0.86} />
          <FeatureValue label="خطم قصير" value={0.24} />
        </div>
        <div className="answer-buttons" role="group" aria-label="اختر تصنيف الصورة">
          <button className={`answer-button ${choice === 'قطة' ? 'answer-selected' : ''}`} onClick={() => onChoose('قطة')} aria-pressed={choice === 'قطة'}><CatGlyph /> قطة</button>
          <button className={`answer-button ${choice === 'كلب' ? 'answer-selected' : ''}`} onClick={() => onChoose('كلب')} aria-pressed={choice === 'كلب'}><DogGlyph /> كلب</button>
        </div>
        {choice && <p className={`feedback-line ${correct ? 'feedback-good' : 'feedback-nudge'}`} role="status">{correct ? 'أحسنت. هذه العلامات تشبه أمثلة القطط التي رآها النموذج.' : 'اختيار مفهوم. لاحظ أنّ أذنين مدبّبتين وخطماً قصيراً ظهرا كثيراً في أمثلة القطط.'}</p>}
        <p className="science-note">هي لا تفهم الصورة مثل الإنسان؛ بل تتعلّم أنماطاً تتكرّر في أمثلة كثيرة.</p>
      </div>
      <div className="specimen-card">
        <div className="specimen-top"><span>عينة رقم ٠١</span><span className="specimen-dot" /></div>
        <div className="specimen-drawing"><CatGlyph large /><span className="scan-ring ring-one" /><span className="scan-ring ring-two" /><span className="scan-point point-one" /><span className="scan-point point-two" /></div>
        <div className="specimen-label"><span>مجموعة مجهولة</span><strong>{choice ? (correct ? 'قطة' : 'كلب') : '؟'}</strong></div>
        <div className="specimen-line"><span>إشارتان ظاهرتان</span><span>٠٢</span></div>
      </div>
      <div className="workbench-bottom"><span>أول قرار؟ بيدك.</span><button className="button button-primary" onClick={onNext}>تعرّف إلى العصبون <ArrowLeft size={16} /></button></div>
    </div>
  )
}

function FeatureValue({ label, value }: { label: string; value: number }) {
  return <div className="feature-value"><span>{label}</span><b>{percent(value)}</b><span className="feature-bar"><i style={fillMeter(value)} /></span></div>
}

function CatGlyph({ large = false }: { large?: boolean }) {
  return <svg className={`animal-glyph ${large ? 'animal-large' : ''}`} viewBox="0 0 100 90" aria-hidden="true"><path d="M20 33 16 9l24 14a37 37 0 0 1 20 0L84 9l-4 25a34 34 0 1 1-60-1Z" /><path d="M34 46h1m30 0h1M43 60q7 6 14 0M29 55l-12 2m12 4-11 5m53-11 12 2m-12 4 11 5" /><path className="animal-highlight" d="m23 29 15-5m37 5-15-5" /></svg>
}

function DogGlyph() {
  return <svg className="animal-glyph" viewBox="0 0 100 90" aria-hidden="true"><path d="M22 33Q6 13 12 43q1 11 12 16M78 33q16-20 10 10-1 11-12 16M22 35a29 29 0 0 1 56 0v20a28 28 0 0 1-56 0z" /><path d="M37 46h1m25 0h1M43 62q7 5 14 0m-8-10q-3 5-2 9h6q1-4-2-9" /></svg>
}

function NeuronChapter({ score, weights, onWeight, onReset, onNext }: { score: number; weights: number[]; onWeight: (index: number, value: number) => void; onReset: () => void; onNext: () => void }) {
  const labels = ['صفاء السماء', 'حرارة مناسبة', 'احتمال المطر']
  const values = [0.85, 0.7, 0.35]
  return (
    <div className="neuron-layout">
      <div className="control-panel">
        <div className="panel-topline"><span className="section-kicker">قرّب القرار</span><button className="icon-button" onClick={onReset} aria-label="إعادة أوزان العصبون إلى البداية"><RotateCcw size={16} /></button></div>
        <h3>هل أخرج اليوم؟</h3>
        <p className="panel-description">حرّك أهمية كل عامل. راقب كيف يتغيّر ميل العصبون إلى قرار الخروج.</p>
        <div className="weight-controls">
          {labels.map((label, index) => <WeightSlider key={label} label={label} inputValue={values[index] ?? 0} weight={weights[index] ?? 0} onChange={(value) => onWeight(index, value)} />)}
        </div>
        <div className="weight-definition"><span className="definition-mark">و</span><span><strong>الوزن</strong> هو درجة الأهمية التي يعطيها العصبون لكل معلومة.</span></div>
        <div className="panel-bottom"><span>اسحب أي منزلق ولاحظ الفرق.</span><button className="button button-primary" onClick={onNext}>ابنِ شبكة صغيرة <ArrowLeft size={16} /></button></div>
      </div>
      <div className="neuron-display">
        <div className="display-heading"><span>عصبون واحد</span><span className="live-label"><i /> يعمل الآن</span></div>
        <div className="single-neuron-visual">
          {labels.map((label, index) => <div className="input-chip" key={label}><span>{label}</span><span className="chip-line" style={{ opacity: 0.3 + Math.abs(weights[index] ?? 0) * 0.65, borderColor: (weights[index] ?? 0) < 0 ? 'var(--clay)' : 'var(--mint)' }} /><b>{number(values[index] ?? 0)}</b></div>)}
          <div className="neuron-circle"><span>ع</span><small>عصبون</small></div>
          <div className="neuron-output"><span className="output-dash" /><b>{score >= 0.5 ? 'أخرج' : 'ابقَ'}</b><strong>{percent(score)}</strong></div>
        </div>
        <div className="probability-meter"><span>ميل القرار</span><div className="meter-track"><i style={fillMeter(score)} /></div><b>{score >= 0.5 ? 'نعم' : 'ليس بعد'}</b></div>
        <p className="display-caption">اللون الأخضر يزيد الميل؛ والطيني يقلّله.</p>
      </div>
    </div>
  )
}

function WeightSlider({ label, inputValue, weight, onChange, min = -1, max = 1 }: { label: string; inputValue: number; weight: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const progress = Math.min(100, Math.max(0, ((weight - min) / (max - min)) * 100))
  return <label className="weight-control">
    <span className="slider-label"><span>{label}<small>الإشارة الحالية: {percent(inputValue)}</small></span><b className={weight < 0 ? 'negative-weight' : ''}>{weight >= 0 ? '+' : '−'}{number(Math.abs(weight))}</b></span>
    <input aria-label={`وزن ${label}`} type="range" min={min} max={max} step="0.05" value={weight} onChange={(event) => onChange(Number(event.target.value))} style={{ '--range-progress': `${progress}%` } as CSSProperties} />
  </label>
}

function InputSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="weight-control">
    <span className="slider-label"><span>{label}<small>شدّة العلامة: {percent(value)}</small></span><b>{percent(value)}</b></span>
    <input aria-label={`شدّة علامة ${label}`} type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ '--range-progress': `${value * 100}%` } as CSSProperties} />
  </label>
}

function NetworkChapter({ parameters, inputs, onInput, onReset, onNext }: { parameters: NetworkParameters; inputs: Pair; onInput: (index: number, value: number) => void; onReset: () => void; onNext: () => void }) {
  const prediction = forward(parameters, inputs)
  return <div className="network-layout">
    <div className="network-tools">
      <div className="network-instruction"><span className="section-kicker">إشارة تدخل · إشارات تلتقي · توقّع يخرج</span><h3>حرّك العلامات، واتبع الإشارة.</h3><p>هذه الشبكة الصغيرة تتعلّم التمييز بين صورة قطة وصورة كلب. لا تحفظ النتيجة؛ جرّب تغيير المدخلات.</p></div>
      <div className="network-input-controls">
        <InputSlider label="أذنان مدبّبتان" value={inputs[0]} onChange={(value) => onInput(0, value)} />
        <InputSlider label="خطم طويل" value={inputs[1]} onChange={(value) => onInput(1, value)} />
      </div>
      <div className="prediction-card"><span>التوقّع الحالي</span><strong>{prediction.probability >= 0.5 ? 'قطة' : 'كلب'}</strong><b>{percent(prediction.probability)} ميل إلى «قطة»</b><span className="prediction-track"><i style={fillMeter(prediction.probability)} /></span></div>
      <div className="network-actions"><button className="button button-primary" onClick={onNext}>شاهد كيف تتعلّم <ArrowLeft size={16} /></button><button className="reset-button" onClick={onReset}><RotateCcw size={14} /> إعادة الإشارات</button></div>
    </div>
    <div className="network-canvas-wrap"><NetworkDiagram parameters={parameters} inputs={inputs} active /><div className="diagram-legend"><span><i className="legend-dot legend-input" /> معلومة</span><span><i className="legend-dot legend-hidden" /> عصبون</span><span><i className="legend-dot legend-output" /> توقّع</span></div></div>
  </div>
}

function NetworkDiagram({ parameters, inputs, active, compactLabel, animate = false }: { parameters: NetworkParameters; inputs: Pair; active?: boolean; compactLabel?: string; animate?: boolean }) {
  return <div className="network-stage-host">
    <Stage width={760} height={340} compact={{ below: 520, width: 340, height: 340 }} initial={{ flowing: false }} poster={{ flowing: false }} script={animate ? signalStory : undefined} play="once" theme="dark" palette="mono" fidelity="realistic" className="network-stage" tokens={{ '--ss-radius-md': '16px', '--ss-radius-lg': '24px', '--ss-accent': '#71d1ae', '--ss-ink': '#f1eddf', '--ss-bg': '#151d1c' }}>
      {(state, _rect, layout) => {
        const compact = layout === 'compact'
        const w = compact ? 340 : 760
        const h = 340
        const x = compact ? { out: 36, hidden: 158, input: 278 } : { out: 68, hidden: 365, input: 662 }
        const ys = compact ? { in1: 88, in2: 248, h1: 93, h2: 245, out: 169 } : { in1: 105, in2: 236, h1: 90, h2: 250, out: 170 }
        const activeNow = active ?? state.flowing
        const links = [
          { a: [x.input, ys.in1], b: [x.hidden, ys.h1], weight: parameters.inputWeights[0][0], key: 'أ' },
          { a: [x.input, ys.in1], b: [x.hidden, ys.h2], weight: parameters.inputWeights[0][1], key: 'ب' },
          { a: [x.input, ys.in2], b: [x.hidden, ys.h1], weight: parameters.inputWeights[1][0], key: 'ج' },
          { a: [x.input, ys.in2], b: [x.hidden, ys.h2], weight: parameters.inputWeights[1][1], key: 'د' },
          { a: [x.hidden, ys.h1], b: [x.out, ys.out], weight: parameters.outputWeights[0], key: 'هـ' },
          { a: [x.hidden, ys.h2], b: [x.out, ys.out], weight: parameters.outputWeights[1], key: 'و' },
        ] as const
        return <div className={`network-scene ${compact ? 'network-scene-compact' : ''}`} data-active={activeNow}>
          <div className="scene-heading"><span>مسار التوقّع</span><span className="scene-hint">{compactLabel ?? 'تابع الإشارة من اليمين إلى اليسار'}</span></div>
          <svg className="network-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="رسم شبكة عصبية صغيرة، تدخلها معلومتان من اليمين وتمرّان بعصبونين قبل التوقّع على اليسار">
            <defs><marker id="arrow-green" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 6 4 1 7" fill="none" stroke="#71d1ae" strokeWidth="1.5" /></marker><marker id="arrow-clay" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 6 4 1 7" fill="none" stroke="#d87959" strokeWidth="1.5" /></marker></defs>
            {links.map((link) => <g key={link.key}><path className={`network-link ${activeNow ? 'signal-live' : ''}`} d={`M ${link.a[0] - (compact ? 24 : 28)} ${link.a[1]} C ${(link.a[0] + link.b[0]) / 2} ${link.a[1]}, ${(link.a[0] + link.b[0]) / 2} ${link.b[1]}, ${link.b[0] + (compact ? 25 : 30)} ${link.b[1]}`} stroke={link.weight < 0 ? '#d87959' : '#71d1ae'} strokeOpacity={0.32 + Math.min(1, Math.abs(link.weight) / 4) * 0.62} strokeWidth={1.1 + Math.min(1, Math.abs(link.weight) / 3) * 2.1} markerEnd={link.weight < 0 ? 'url(#arrow-clay)' : 'url(#arrow-green)'}><title>{`قوة الوصلة ${number(Math.abs(link.weight))}`}</title></path>{activeNow && <circle className="signal-particle" r="3.2" fill={link.weight < 0 ? '#e9a087' : '#a8efd3'}><animateMotion dur="1.8s" repeatCount="indefinite" path={`M ${link.a[0] - 26} ${link.a[1]} C ${(link.a[0] + link.b[0]) / 2} ${link.a[1]}, ${(link.a[0] + link.b[0]) / 2} ${link.b[1]}, ${link.b[0] + 28} ${link.b[1]}`} /></circle>}</g>)}
            <SvgNode x={x.input} y={ys.in1} radius={compact ? 24 : 28} label="علامة ١" value={percent(inputs[0])} kind="input" />
            <SvgNode x={x.input} y={ys.in2} radius={compact ? 24 : 28} label="علامة ٢" value={percent(inputs[1])} kind="input" />
            <SvgNode x={x.hidden} y={ys.h1} radius={compact ? 24 : 29} label="يرصد الأذن" value="عصبون" kind="hidden" />
            <SvgNode x={x.hidden} y={ys.h2} radius={compact ? 24 : 29} label="يرصد الخطم" value="عصبون" kind="hidden" />
            <SvgNode x={x.out} y={ys.out} radius={compact ? 27 : 34} label="قرار" value={classify(parameters, inputs) === 1 ? 'قطة' : 'كلب'} kind="output" />
            {!compact && <g className="layer-labels"><text x={x.input} y="320" textAnchor="middle">المعلومات</text><text x={x.hidden} y="320" textAnchor="middle">المعالجة</text><text x={x.out} y="320" textAnchor="middle">التوقّع</text></g>}
          </svg>
          <div className="scene-foot"><span className="flow-arrow">←</span><span>تسير الإشارة نحو القرار</span><span className="scene-foot-value">{percent(forward(parameters, inputs).probability)}</span></div>
        </div>
      }}
    </Stage>
  </div>
}

function SvgNode({ x, y, radius, label, value, kind }: { x: number; y: number; radius: number; label: string; value: string; kind: 'input' | 'hidden' | 'output' }) {
  return <g className={`svg-node node-${kind}`}><circle cx={x} cy={y} r={radius + 7} className="node-halo" /><circle cx={x} cy={y} r={radius} className="node-core" /><text x={x} y={y - 2} textAnchor="middle" className="node-value">{value}</text><text x={x} y={y + radius + 22} textAnchor="middle" className="node-label">{label}</text></g>
}

function TrainingChapter({ parameters, metrics, epochs, rate, running, onRate, onTrain, onReset, onNext }: { parameters: NetworkParameters; metrics: ReturnType<typeof measureModel>; epochs: number; rate: number; running: boolean; onRate: (value: number) => void; onTrain: () => void; onReset: () => void; onNext: () => void }) {
  const prediction = forward(parameters, [0.9, 0.25])
  return <div className="training-layout">
    <div className="training-main">
      <div className="training-story"><span className="section-kicker">تعلم من أمثلة القطط والكلاب</span><h3>الخطأ يغيّر ما ستفعله الشبكة لاحقاً.</h3><p>توقّع الشبكة الأوليّ معكوس. في كل خطوة، نقيس الخطأ ونعدّل الوصلات قليلاً ليصبح التوقّع أقرب.</p></div>
      <div className="training-network"><NetworkDiagram parameters={parameters} inputs={[0.9, 0.25]} active={running} /></div>
      <div className="training-observation"><div className="observation-label"><span>عينة قطة</span><b className={prediction.probability >= 0.5 ? 'correct-tag' : 'mistake-tag'}>{prediction.probability >= 0.5 ? 'توقّع صحيح' : 'توقّع خاطئ'}</b></div><div className="observation-prediction"><strong>{prediction.probability >= 0.5 ? 'قطة' : 'كلب'}</strong><span>ميل النموذج إلى «قطة»</span><b>{percent(prediction.probability)}</b></div></div>
    </div>
    <div className="training-side">
      <div className="training-metrics"><div className="metric-heading"><span>كيف تسير التوقّعات؟</span><span className="live-label"><i /> قيم حقيقية</span></div><Metric label="عدد الأخطاء" value={`${number(metrics.mistakes)} / ${number(TRAINING_EXAMPLES.length)}`} tone={metrics.mistakes === 0 ? 'good' : undefined} /><Metric label="دقّة الأمثلة" value={percent(metrics.accuracy)} tone={metrics.accuracy > 0.75 ? 'good' : undefined} /><Metric label="متوسّط الخطأ" value={number(metrics.averageLoss)} tone={metrics.averageLoss < 0.4 ? 'good' : undefined} /><div className="progress-detail"><span>خطوات التدريب</span><b>{number(epochs)}</b></div><div className="epoch-track"><i style={fillMeter(Math.min(1, epochs / 80))} /></div></div>
      <label className="rate-control"><span>قوة التعديل <b>{number(rate)}</b></span><input type="range" min="0.1" max="0.8" step="0.05" value={rate} onChange={(event) => onRate(Number(event.target.value))} disabled={running} aria-label="قوة تعديل الأوزان" /></label>
      <div className="training-actions"><button className="button button-primary button-wide" onClick={onTrain} disabled={running}>{running ? <><span className="button-pulse" /> الشبكة تتعلّم…</> : <>ابدأ التدريب <ArrowLeft size={16} /></>}</button><button className="reset-button" onClick={onReset} disabled={running}><RotateCcw size={14} /> أعد التجربة</button></div>
      <details className="optional-note"><summary>ماذا يعني تعديل الأوزان؟ <ChevronDown size={15} /></summary><p>تستخدم الشبكة قاعدة حسابية بسيطة: تغيّر الأوزان في الاتجاه الذي يقلّل الخطأ، بمقدار يناسب «قوة التعديل» التي اخترتها. هذه الفكرة تكرّرها عبر أمثلة التدريب.</p></details>
      <button className="button button-secondary button-wide" onClick={onNext}>أصبحتَ جاهزاً للتحديات <ArrowLeft size={16} /></button>
    </div>
  </div>
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return <div className="metric-row"><span>{label}</span><strong className={tone === 'good' ? 'metric-good' : ''}>{value}</strong></div>
}

type GamesProps = {
  gameIndex: number
  wonGames: boolean[]
  allGamesWon: boolean
  importance: SliderChallenge
  importanceScore: number
  gameParameters: NetworkParameters
  gameMetrics: ReturnType<typeof measureModel>
  gameRate: number
  gameTraining: boolean
  rescue: SliderChallenge
  rescueScores: [number, number]
  onGame: (index: number) => void
  onImportance: (index: number, value: number) => void
  onImportanceReset: () => void
  onImportanceWin: () => void
  onGameRate: (value: number) => void
  onGameTrain: () => void
  onGameReset: () => void
  onGameWin: () => void
  onRescue: (index: number, value: number) => void
  onRescueReset: () => void
  onRescueWin: () => void
  onCelebrate: () => void
}

function GamesChapter(props: GamesProps) {
  const tabs = ['ما المعلومة الأهم؟', 'علّم الآلة بنفسك!', 'أنقذ الشبكة العصبية!']
  if (props.gameIndex === 3) return <Celebration onReplay={() => props.onGame(0)} onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
  return <div className="games-layout">
    <div className="game-rail" role="tablist" aria-label="الألعاب الثلاث">
      {tabs.map((title, index) => <button key={title} role="tab" id={`game-tab-${index}`} aria-selected={props.gameIndex === index} aria-controls="game-panel" className={`game-tab ${props.gameIndex === index ? 'game-tab-current' : ''} ${props.wonGames[index] ? 'game-tab-won' : ''}`} onClick={() => props.onGame(index)}><span className="game-tab-number">{props.wonGames[index] ? <Check size={14} /> : number(index + 1)}</span><span>{title}</span><span className="game-tab-status">{props.wonGames[index] ? 'مكتمل' : 'العب'}</span></button>)}
      <div className="game-completion-count"><span>التحديات المنجزة</span><strong>{number(props.wonGames.filter(Boolean).length)} <small>/ ٣</small></strong></div>
      <p className="game-rail-note">كل فوز يثبت فكرة تعلّمتها. جرّب أكثر من مرة.</p>
    </div>
    <div className="game-panel" id="game-panel" role="tabpanel" aria-labelledby={`game-tab-${props.gameIndex}`}>
      {props.gameIndex === 0 && <ImportanceGame {...props} />}
      {props.gameIndex === 1 && <TeachGame {...props} />}
      {props.gameIndex === 2 && <RescueGame {...props} />}
    </div>
    {props.allGamesWon && <div className="all-games-banner"><span><Sparkle size={17} /> أتممت الألعاب الثلاث! أنت جاهز للاحتفال.</span><button className="text-button" onClick={props.onCelebrate}>اكشف المفاجأة <ArrowLeft size={15} /></button></div>}
  </div>
}

function ImportanceGame(props: GamesProps) {
  const won = hasChosenImportance(props.importance)
  useEffect(() => { if (won) props.onImportanceWin() }, [won])
  const labels = ['صفاء السماء', 'حرارة مناسبة', 'احتمال المطر']
  return <div className="game-content">
    <div className="game-heading"><span className="game-label">لعبة ١ · الأهمية</span><h3>اجعل قرار الخروج مرجّحاً.</h3><p>غيّر أوزان العوامل حتى يتجاوز ميل العصبون إلى «أخرج» ٧٠٪.</p></div>
    <div className="game-body importance-body"><div className="game-sliders">{labels.map((label, i) => <WeightSlider key={label} label={label} inputValue={props.importance.inputs[i] ?? 0} weight={props.importance.weights[i] ?? 0} onChange={(value) => props.onImportance(i, value)} />)}<div className="hint-box"><CircleHelp size={16} /><span>تلميح: أيّ عامل يجعل الخروج أقلّ رغبةً؟ يمكنك إعطاؤه وزناً سالباً.</span></div></div><div className={`game-result ${won ? 'result-won' : ''}`}><span>ميل قرار «أخرج»</span><strong>{percent(props.importanceScore)}</strong><div className="big-meter"><i style={fillMeter(props.importanceScore)} /></div><span>{won ? 'وصلت إلى الهدف!' : 'الهدف: ٧٠٪ أو أكثر'}</span>{won && <div className="win-feedback" role="status"><Check size={16} /> اخترتَ ما يستحق الانتباه.</div>}</div></div>
    <div className="game-bottom"><button className="reset-button" onClick={props.onImportanceReset}><RotateCcw size={14} /> ابدأ من جديد</button><button className="button button-secondary" onClick={() => props.onGame(1)}>اللعبة التالية <ArrowLeft size={16} /></button></div>
  </div>
}

function TeachGame(props: GamesProps) {
  const won = props.gameMetrics.mistakes <= 1
  useEffect(() => { if (won) props.onGameWin() }, [won])
  return <div className="game-content">
    <div className="game-heading"><span className="game-label">لعبة ٢ · التدريب</span><h3>علّم الآلة بنفسك!</h3><p>درّب النموذج على ثماني صور بسيطة. هدفك: خفض عدد الأخطاء إلى واحد أو أقل.</p></div>
    <div className="teach-intro-row"><div className="sample-pills"><span><CatGlyph /> أربع صور قطط</span><span><DogGlyph /> أربع صور كلاب</span></div><div className="mistake-score"><span>الأخطاء الآن</span><strong className={won ? 'metric-good' : ''}>{number(props.gameMetrics.mistakes)} <small>/ ٨</small></strong></div></div>
    <div className="mini-network"><NetworkDiagram parameters={props.gameParameters} inputs={[0.9, 0.25]} active={props.gameTraining} /></div>
    <div className="game-training-controls"><label className="rate-control"><span>قوة التعلّم <b>{number(props.gameRate)}</b></span><input type="range" min="0.1" max="0.8" step="0.05" value={props.gameRate} onChange={(event) => props.onGameRate(Number(event.target.value))} disabled={props.gameTraining} aria-label="قوة التعلّم في اللعبة" /></label><button className="button button-primary" onClick={props.onGameTrain} disabled={props.gameTraining}>{props.gameTraining ? <>يجري التدريب… <span className="button-pulse" /></> : <>ابدأ التدريب <ArrowLeft size={16} /></>}</button><button className="reset-button" onClick={props.onGameReset} disabled={props.gameTraining}><RotateCcw size={14} /> إعادة النموذج</button></div>
    {won && <div className="win-feedback game-wide-feedback" role="status"><Check size={16} /> نجحت! خفّض التدريب الأخطاء باستخدام أمثلة فعلية.</div>}
    {!won && <p className="game-nudge">التغيير الصغير يتراكم. اضغط «ابدأ التدريب» مرة أخرى إذا لزم.</p>}
    <div className="game-bottom"><span>تُحسب التوقّعات من الأوزان الحالية.</span><button className="button button-secondary" onClick={() => props.onGame(2)}>اللعبة التالية <ArrowLeft size={16} /></button></div>
  </div>
}

function RescueGame(props: GamesProps) {
  const won = hasRescuedNetwork(props.rescue)
  useEffect(() => { if (won) props.onRescueWin() }, [won])
  const labels = ['أذنان مدبّبتان', 'خطم طويل']
  return <div className="game-content">
    <div className="game-heading"><span className="game-label">لعبة ٣ · الإنقاذ</span><h3>أصلح القرارين.</h3><p>الشبكة تخلط بين عينة قطة وعينة كلب. اضبط الوصلتين حتى يتجاوز قرار القطة ٧٠٪ ويهبط قرار الكلب تحت ٣٠٪.</p></div>
    <div className="rescue-samples">{props.rescueScores.map((score, index) => <div className="rescue-sample" key={index}><div className="rescue-sample-icon">{index === 0 ? <CatGlyph /> : <DogGlyph />}</div><div><span>عينة {index === 0 ? 'قطة' : 'كلب'}</span><strong>{percent(score)}</strong></div><div className={`sample-verdict ${(index === 0 ? score >= 0.7 : score <= 0.3) ? 'verdict-correct' : 'verdict-wrong'}`}>{(index === 0 ? score >= 0.7 : score <= 0.3) ? 'صحيح' : 'خطأ'}</div></div>)}</div>
    <div className="rescue-controls">{labels.map((label, i) => <WeightSlider key={label} label={label} inputValue={i === 0 ? 0.9 : 0.9} weight={props.rescue.weights[i] ?? 0} min={-2} max={2} onChange={(value) => props.onRescue(i, value)} />)}<div className="rescue-hint"><CircleHelp size={16} /><span>تلميح: العلامة التي تدلّ على القطة يجب أن تساعد قرار القطة.</span></div></div>
    {won && <div className="win-feedback" role="status"><Check size={16} /> أُنقذت الشبكة. كلا التوقّعين الآن صحيح.</div>}
    <div className="game-bottom"><button className="reset-button" onClick={props.onRescueReset}><RotateCcw size={14} /> إعادة المحاولة</button>{won ? <button className="button button-primary" onClick={props.onCelebrate}>أنهِ الرحلة <Sparkle size={16} /></button> : <button className="button button-secondary" onClick={() => props.onGame(1)}>أعد التدريب <ArrowRight size={16} /></button>}</div>
  </div>
}

function Celebration({ onReplay, onHome }: { onReplay: () => void; onHome: () => void }) {
  const concepts = ['الشبكة تستقبل معلومات.', 'لكل معلومة وزن يحدّد أهميتها.', 'العصبونات تتعاون لإنتاج توقّع.', 'التوقّع قد يصيب أو يخطئ.', 'التدريب يعدّل الأوزان لتقليل الخطأ.']
  return <div className="celebration" role="status" aria-live="polite">
    <div className="celebration-mark" aria-hidden="true"><span /><span /><span /><i /><i /><b /></div>
    <p className="eyebrow"><span className="eyebrow-line" /> اكتملت الرحلة</p>
    <h3>مبروك! لقد فهمت سرّ تعلّم الذكاء الاصطناعي!</h3>
    <p className="celebration-lead">خمس أفكار أساسية أصبحت بين يديك.</p>
    <div className="concept-grid">{concepts.map((concept, i) => <div className="concept-item" key={concept}><span>{number(i + 1)}</span><b>{concept}</b></div>)}</div>
    <div className="celebration-actions"><button className="button button-primary" onClick={onReplay}>العب من جديد <RotateCcw size={16} /></button><button className="button button-secondary" onClick={onHome}>إلى البداية <ArrowRight size={16} /></button></div>
    <p className="celebration-quote">«كنت أظنّها معقّدة... والآن أستطيع شرحها.»</p>
  </div>
}

export default App
