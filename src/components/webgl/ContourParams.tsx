export class ContourParams {
  constructor(
    public enabled: boolean = false,
    public value: number = 0.0,
    public range: number = 1.0,
  ) {}
}

export function ContourParamsComponent({
  contourRef,
  name,
}: {
  contourRef: React.RefObject<ContourParams>;
  name: string;
}) {
  return (
    <>
      <div className="contour-params">
        <div className="cp-header">
          <p>{name}</p>
          <div className="enabled-box">
            <label>Enabled</label>
            <input
              type="checkbox"
              onChange={(e) => (contourRef.current.enabled = e.target.checked)}
            />
          </div>
        </div>
        <div className="slider-container">
          <p>Value</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            defaultValue={0.0}
            onChange={(e) =>
              (contourRef.current.value = Number(e.target.value))
            }
          />
          <p>Range</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            defaultValue={1.0}
            onChange={(e) =>
              (contourRef.current.range = Number(e.target.value))
            }
          />
        </div>
      </div>
    </>
  );
}
