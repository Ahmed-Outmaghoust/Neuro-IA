# StageShow scene kit

This directory contains the StageShow kit files needed by the neural-network stage. The kit source was copied from the locally installed StageShow skill so this project does not depend on an external service or runtime package. Only the stage, cursor, measurement, timing, and reduced-motion files used by the scene are included.

The application code that provides the model values remains strictly type-checked. The copied kit files retain the upstream implementation and use TypeScript's per-file check suppression because the kit is authored against a broader project configuration than this app.
