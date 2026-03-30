import { describe, expect, it } from 'vitest'

import extractApiErrors from './extractApiErrors'


describe('extractApiErrors', () => {
  it('maps detail responses to form errors', () => {
    const result = extractApiErrors({
      response: {
        status: 400,
        data: {
          detail: ['Only the server owner can do that.'],
        },
      },
    })

    expect(result).toEqual({
      form: 'Only the server owner can do that.',
    })
  })

  it('detects html error payloads and returns a safer message', () => {
    const result = extractApiErrors({
      response: {
        status: 502,
        data: '<!DOCTYPE html><html><body>bad gateway</body></html>',
      },
    })

    expect(result.form).toContain('HTML error page')
  })

  it('flattens nested field errors into strings', () => {
    const result = extractApiErrors({
      response: {
        status: 400,
        data: {
          email: ['Already in use.'],
          profile: {
            bio: ['Too long.'],
          },
        },
      },
    })

    expect(result).toEqual({
      email: 'Already in use.',
      profile: 'Too long.',
    })
  })
})
