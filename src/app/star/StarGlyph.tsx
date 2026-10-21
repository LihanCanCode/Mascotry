/**
 * A five-pointed star, drawn here rather than fetched.
 *
 * The project promises it loads nothing from anywhere else, so a badge service
 * or an icon font is out of the question. It is an outline in `currentColor`
 * because every other mark in this interface is: 2px ink on paper.
 */
export function StarGlyph(): React.JSX.Element {
  return (
    <svg className="star-glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 3.1 14.82 8.79 21.1 9.71 16.55 14.15 17.63 20.4 12 17.45 6.37 20.4 7.45 14.15 2.9 9.71 9.18 8.79Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
