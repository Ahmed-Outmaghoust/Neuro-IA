import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('رحلة نَسَق التفاعلية', () => {
  it('يشرح المثال الأول ويعطي تغذية راجعة بالعربية', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /هل تستطيع الآلة أن تتعلّم/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'قطة' }))

    expect(screen.getByRole('status')).toHaveTextContent('أحسنت')
    expect(screen.getByText(/لا تفهم الصورة مثل الإنسان/)).toBeInTheDocument()
  })

  it('يحدّث قرار العصبون عند تعديل وزن معلومة', () => {
    render(<App />)
    fireEvent.click(within(screen.getByRole('navigation', { name: 'اختر محطة' })).getByRole('button', { name: /العصبون/ }))
    const before = screen.getByText('ميل القرار').parentElement?.querySelector('b')?.textContent

    fireEvent.change(screen.getByRole('slider', { name: 'وزن صفاء السماء' }), { target: { value: '-1' } })

    const after = screen.getByText('ميل القرار').parentElement?.querySelector('b')?.textContent
    expect(after).not.toBe(before)
  })

  it('يكمل لعبة الأهمية حين يبلغ التوقّع هدفه المحسوب', async () => {
    render(<App />)
    fireEvent.click(within(screen.getByRole('navigation', { name: 'اختر محطة' })).getByRole('button', { name: /التحديات/ }))
    fireEvent.change(screen.getByRole('slider', { name: 'وزن صفاء السماء' }), { target: { value: '1' } })
    fireEvent.change(screen.getByRole('slider', { name: 'وزن حرارة مناسبة' }), { target: { value: '1' } })
    fireEvent.change(screen.getByRole('slider', { name: 'وزن احتمال المطر' }), { target: { value: '-1' } })

    expect(await screen.findByText('وصلت إلى الهدف!')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('اخترتَ ما يستحق الانتباه')
  })

  it('يتدرّب النموذج على العيّنات ويقلّ عدد أخطائه فعلياً', async () => {
    render(<App />)
    fireEvent.click(within(screen.getByRole('navigation', { name: 'اختر محطة' })).getByRole('button', { name: /التدريب/ }))
    const mistakeCount = () => {
      const text = screen.getByText('عدد الأخطاء').parentElement?.textContent ?? ''
      const westernDigits = text.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
      return Number(westernDigits.match(/(\d+)\s*\/\s*\d+/)?.[1])
    }
    expect(mistakeCount()).toBe(8)

    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التدريب' }))

    await waitFor(() => expect(mistakeCount()).toBeLessThan(8), { timeout: 7000 })
    expect(screen.getByText('عدد الأخطاء').parentElement).toHaveTextContent(/\/\s*[٨8]/)
  })

  it('يكمل الألعاب الثلاث ويعرض احتفال النهاية', async () => {
    render(<App />)
    const chapters = within(screen.getByRole('navigation', { name: 'اختر محطة' }))
    fireEvent.click(chapters.getByRole('button', { name: /التحديات/ }))
    fireEvent.change(screen.getByRole('slider', { name: 'وزن صفاء السماء' }), { target: { value: '1' } })
    fireEvent.change(screen.getByRole('slider', { name: 'وزن حرارة مناسبة' }), { target: { value: '1' } })
    fireEvent.change(screen.getByRole('slider', { name: 'وزن احتمال المطر' }), { target: { value: '-1' } })

    const gameTabs = within(screen.getByRole('tablist', { name: 'الألعاب الثلاث' }))
    fireEvent.click(gameTabs.getByRole('tab', { name: /علّم الآلة بنفسك/ }))
    fireEvent.click(screen.getByRole('button', { name: 'ابدأ التدريب' }))
    expect(await screen.findByText(/نجحت! خفّض التدريب الأخطاء/, {}, { timeout: 7000 })).toBeInTheDocument()

    fireEvent.click(gameTabs.getByRole('tab', { name: /أنقذ الشبكة العصبية/ }))
    fireEvent.change(screen.getByRole('slider', { name: 'وزن أذنان مدبّبتان' }), { target: { value: '1.5' } })
    fireEvent.change(screen.getByRole('slider', { name: 'وزن خطم طويل' }), { target: { value: '-1.5' } })
    expect(await screen.findByText(/أُنقذت الشبكة/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'اكشف المفاجأة' }))
    expect(screen.getByRole('heading', { name: /مبروك! لقد فهمت سرّ تعلّم الذكاء الاصطناعي/ })).toBeInTheDocument()
    expect(screen.getByText('التدريب يعدّل الأوزان لتقليل الخطأ.')).toBeInTheDocument()
  })
})
