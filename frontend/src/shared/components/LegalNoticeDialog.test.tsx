import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LegalNoticeDialog } from './LegalNoticeDialog'

describe('LegalNoticeDialog', () => {
  it('renders the selected legal notice content', () => {
    render(<LegalNoticeDialog noticeType="terms" onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '이용약관' })).toBeInTheDocument()
    expect(screen.getByText(/소도시 여행지를 탐색하고/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '서비스 이용' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '계정과 저장 정보' })).toBeInTheDocument()
  })

  it('renders privacy and contact notices without exposing empty placeholder links', () => {
    const { rerender } = render(<LegalNoticeDialog noticeType="privacy" onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '개인정보 처리방침' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '수집 및 이용 항목' })).toBeInTheDocument()

    rerender(<LegalNoticeDialog noticeType="contact" onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '문의하기' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '접수 채널' })).toBeInTheDocument()
    expect(screen.getByText('현재 데모 버전에서는 별도 문의 접수 폼을 제공하지 않습니다.')).toBeInTheDocument()
  })

  it('closes from the close button, confirm button, backdrop, and Escape key', () => {
    const onClose = vi.fn()

    render(<LegalNoticeDialog noticeType="contact" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: '문의하기 닫기' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    fireEvent.click(screen.getByTestId('legal-notice-backdrop'))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(4)
  })
})
