export function useRelativeTime() {
  function relativeTime(iso) {
    if (!iso) return 'N/A'
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1)   return 'ahora mismo'
    if (mins < 60)  return `hace ${mins}m`
    if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`
    return `hace ${Math.floor(mins / 1440)}d`
  }
  return { relativeTime }
}
