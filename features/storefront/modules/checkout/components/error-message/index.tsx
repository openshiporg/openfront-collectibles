const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  if (!error) {
    return null
  }

  return (
    <div role="alert" className="pt-2 text-[13px] leading-5 text-cx-danger" data-testid={dataTestid}>
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
