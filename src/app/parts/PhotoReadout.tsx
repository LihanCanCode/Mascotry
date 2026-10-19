import { CONFIDENT, PHOTO_FIELD_LABELS } from '../../photo'
import type { PhotoField, PhotoReading } from '../../photo'
import type { StudioConfig } from '../../studio'
import { CHOICE_CONTROLS, COLOUR_CONTROLS, optionLabel, patch } from '../state/controls'

/** The order the rows are shown in: colouring first, then the parts. */
const ORDER: readonly PhotoField[] = ['skin', 'hairColor', 'hairStyle', 'facialHair', 'glasses', 'ears', 'shirt']

interface RowProps {
  readonly field: PhotoField
  readonly value: string
  readonly confidence: number
  readonly config: StudioConfig
  readonly onChange: (patch: Partial<StudioConfig>) => void
}

function isColour(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

/** The control that lets a reading be overridden: a swatch for a colour, a list for a part. */
function Override({ field, config, onChange }: Omit<RowProps, 'value' | 'confidence'>): React.JSX.Element {
  const colour = COLOUR_CONTROLS.find((control) => control.key === field)
  if (colour !== undefined) {
    return (
      <input
        id={`photo-${field}`}
        type="color"
        value={config[colour.key]}
        onChange={(event) => onChange(patch(colour.key, event.target.value))}
      />
    )
  }
  const choice = CHOICE_CONTROLS.find((control) => control.key === field)
  if (choice === undefined) return <span className="readout-fixed">Not changeable here</span>
  return (
    <select
      id={`photo-${field}`}
      className="select"
      value={config[choice.key]}
      onChange={(event) => onChange(patch(choice.key, event.target.value))}
    >
      {choice.options.map((option) => (
        <option key={option} value={option}>{optionLabel(option)}</option>
      ))}
    </select>
  )
}

function Row({ field, value, confidence, config, onChange }: RowProps): React.JSX.Element {
  const used = confidence >= CONFIDENT
  const percent = Math.round(confidence * 100)
  return (
    <li className="readout-row">
      <label className="field-label" htmlFor={`photo-${field}`}>{PHOTO_FIELD_LABELS[field]}</label>
      <span className="readout-read">
        {isColour(value)
          ? <span className="readout-chip" style={{ background: value }} aria-hidden="true" />
          : null}
        {isColour(value) ? value : optionLabel(value)}
      </span>
      <span className={used ? 'readout-sure' : 'readout-unsure'}>
        {percent}% sure{used ? ', used' : ', left alone'}
      </span>
      <Override field={field} config={config} onChange={onChange} />
    </li>
  )
}

interface PhotoReadoutProps {
  readonly reading: PhotoReading
  readonly config: StudioConfig
  readonly onChange: (patch: Partial<StudioConfig>) => void
}

/**
 * What the photograph was read as, field by field, with every field overridable.
 *
 * The confidence is shown rather than hidden, and so is the consequence of it:
 * a row either says "used" or "left alone", because a number on its own does
 * not tell anyone whether their character changed.
 */
export function PhotoReadout({ reading, config, onChange }: PhotoReadoutProps): React.JSX.Element {
  const rows = ORDER.flatMap((field) => {
    const read = reading.values[field]
    return read === undefined ? [] : [{ field, value: String(read.value), confidence: read.confidence }]
  })

  return (
    <div className="readout">
      <h3 className="readout-title">What the photo was read as</h3>
      {rows.length === 0
        ? <p className="account">Nothing was read from that photo.</p>
        : (
          <ul className="readout-list" aria-label="What was read">
            {rows.map((row) => (
              <Row
                key={row.field}
                field={row.field}
                value={row.value}
                confidence={row.confidence}
                config={config}
                onChange={onChange}
              />
            ))}
          </ul>
        )}
      <ul className="readout-notes" aria-label="What was not read">
        {reading.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </div>
  )
}
