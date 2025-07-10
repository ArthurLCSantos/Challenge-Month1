export function useCheckboxStyle(ref, value) {
  if (ref.current) {
    ref.current.style.backgroundColor = value ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0)'
  }
}