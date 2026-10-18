import { STUDIO_PRESETS } from '../studio'
import { DEMO_CAST, castConfig, castMember, createSheetStore, type SheetUrls } from './demoLogic'

const urls = (id: string): SheetUrls => ({ directions: `blob:${id}-d`, reactions: `blob:${id}-r` })

describe('DEMO_CAST', () => {
  it('casts only characters the studio can actually draw', () => {
    const known = new Set(STUDIO_PRESETS.map((preset) => preset.id))
    for (const member of DEMO_CAST) {
      expect(known.has(member.id), member.id).toBe(true)
    }
  })

  it('gives each member their own id and their own name', () => {
    expect(new Set(DEMO_CAST.map((m) => m.id)).size).toBe(DEMO_CAST.length)
    expect(new Set(DEMO_CAST.map((m) => m.name)).size).toBe(DEMO_CAST.length)
  })

  it('offers enough to be a choice but few enough to make one', () => {
    expect(DEMO_CAST.length).toBeGreaterThanOrEqual(4)
    expect(DEMO_CAST.length).toBeLessThanOrEqual(8)
  })

  it('finds a member by id and nothing by a wrong one', () => {
    expect(castMember('fox')?.name).toBe('Fennel')
    expect(castMember('nobody')).toBeUndefined()
  })

  it('reaches the studio config behind a member', () => {
    expect(castConfig('fox')).toBe(STUDIO_PRESETS.find((p) => p.id === 'fox')?.config)
    expect(castConfig('nobody')).toBeUndefined()
  })
})

describe('createSheetStore', () => {
  it('draws a character once however often it is asked for', async () => {
    let calls = 0
    const store = createSheetStore({
      make: (id) => {
        calls += 1
        return Promise.resolve(urls(id))
      },
      revoke: () => undefined,
    })

    const first = await store.get('fox')
    const second = await store.get('fox')

    expect(calls).toBe(1)
    expect(second).toEqual(first)
  })

  it('does not start a second render while the first is still running', async () => {
    let calls = 0
    const store = createSheetStore({
      make: (id) => {
        calls += 1
        return Promise.resolve(urls(id))
      },
      revoke: () => undefined,
    })

    await Promise.all([store.get('fox'), store.get('fox'), store.get('fox')])

    expect(calls).toBe(1)
  })

  it('keeps each character separate', async () => {
    const store = createSheetStore({ make: (id) => Promise.resolve(urls(id)), revoke: () => undefined })
    expect((await store.get('fox')).directions).toBe('blob:fox-d')
    expect((await store.get('cat')).directions).toBe('blob:cat-d')
  })

  it('releases every URL it handed out when disposed', async () => {
    const revoked: string[] = []
    const store = createSheetStore({
      make: (id) => Promise.resolve(urls(id)),
      revoke: (url) => revoked.push(url),
    })

    await store.get('fox')
    await store.get('cat')
    store.dispose()

    expect(revoked.sort()).toEqual(['blob:cat-d', 'blob:cat-r', 'blob:fox-d', 'blob:fox-r'])
  })

  it('revokes nothing twice', async () => {
    const revoked: string[] = []
    const store = createSheetStore({
      make: (id) => Promise.resolve(urls(id)),
      revoke: (url) => revoked.push(url),
    })
    await store.get('fox')
    store.dispose()
    store.dispose()
    expect(revoked).toHaveLength(2)
  })

  /** A render that failed must be retried, not remembered as the answer. */
  it('forgets a failed render so the next ask tries again', async () => {
    let calls = 0
    const store = createSheetStore({
      make: (id) => {
        calls += 1
        return calls === 1 ? Promise.reject(new Error('no canvas')) : Promise.resolve(urls(id))
      },
      revoke: () => undefined,
    })

    await expect(store.get('fox')).rejects.toThrow('no canvas')
    expect((await store.get('fox')).directions).toBe('blob:fox-d')
    expect(calls).toBe(2)
  })
})
