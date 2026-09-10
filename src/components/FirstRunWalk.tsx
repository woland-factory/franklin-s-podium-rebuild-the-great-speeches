const STEPS = [
  "Read the hints below.",
  "Record your version.",
  "Fix any misheard words.",
  "Study the pairs.",
];

interface FirstRunWalkProps {
  activeStep: number;
  onSkip: () => void;
}

export function FirstRunWalk({ activeStep, onSkip }: FirstRunWalkProps) {
  return (
    <aside className="walk" aria-label="Getting started">
      <h2>Your first rep, in four steps</h2>
      <ol>
        {STEPS.map((step, i) => (
          <li
            key={i}
            className={i < activeStep ? "done" : i === activeStep ? "active" : ""}
            aria-current={i === activeStep ? "step" : undefined}
          >
            {step}
          </li>
        ))}
      </ol>
      <div className="walk-foot">
        <button type="button" className="btn btn-ghost" onClick={onSkip}>
          Skip
        </button>
      </div>
    </aside>
  );
}
