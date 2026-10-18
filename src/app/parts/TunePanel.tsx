import type { StudioConfig } from '../../studio'
import { CHOICE_CONTROLS, COLOUR_CONTROLS, TOGGLE_CONTROLS, optionLabel, patch } from '../state/controls'
import { MAX_NAME } from '../state/reducer'

interface TunePanelProps {
  readonly config: StudioConfig
  readonly name: string
  readonly onName: (name: string) => void
  readonly onChange: (patch: Partial<StudioConfig>) => void
}

/**
 * The controls, built from the lists in `state/controls`.
 *
 * Nothing here knows what an ear type is. The choice controls carry the option
 * arrays the studio exports, so this file renders whatever the studio can draw
 * and will keep doing so as the studio grows.
 */
export function TunePanel({ config, name, onName, onChange }: TunePanelProps): React.JSX.Element {
  return (
    <div className="tune">
      <p className="field">
        <label className="field-label" htmlFor="tune-name">Name</label>
        <input
          id="tune-name"
          className="text-input"
          type="text"
          value={name}
          maxLength={MAX_NAME}
          placeholder="Pip"
          autoComplete="off"
          onChange={(event) => onName(event.target.value)}
        />
        <span className="field-hint">Used for the screen-reader label and the file names.</span>
      </p>

      <fieldset className="group">
        <legend className="group-title">Colours</legend>
        <div className="swatches">
          {COLOUR_CONTROLS.map((control) => (
            <p className="swatch" key={control.key}>
              <label className="field-label" htmlFor={`tune-${control.key}`}>{control.label}</label>
              <input
                id={`tune-${control.key}`}
                type="color"
                value={config[control.key]}
                onChange={(event) => onChange(patch(control.key, event.target.value))}
              />
              <output className="swatch-value">{config[control.key]}</output>
              {control.hint === undefined ? null : <span className="field-hint">{control.hint}</span>}
            </p>
          ))}
        </div>
      </fieldset>

      <fieldset className="group">
        <legend className="group-title">Parts</legend>
        <div className="choices">
          {CHOICE_CONTROLS.map((control) => (
            <p className="field" key={control.key}>
              <label className="field-label" htmlFor={`tune-${control.key}`}>{control.label}</label>
              <select
                id={`tune-${control.key}`}
                className="select"
                value={config[control.key]}
                onChange={(event) => onChange(patch(control.key, event.target.value))}
              >
                {control.options.map((option) => (
                  <option key={option} value={option}>{optionLabel(option)}</option>
                ))}
              </select>
            </p>
          ))}
          {TOGGLE_CONTROLS.map((control) => (
            <p className="field field-check" key={control.key}>
              <input
                id={`tune-${control.key}`}
                type="checkbox"
                checked={config[control.key]}
                onChange={(event) => onChange(patch(control.key, event.target.checked))}
              />
              <label className="field-label" htmlFor={`tune-${control.key}`}>{control.label}</label>
            </p>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
