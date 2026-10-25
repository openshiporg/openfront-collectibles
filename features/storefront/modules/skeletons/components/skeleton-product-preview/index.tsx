const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-[4/5] w-full rounded-[2px] bg-cx-well" />
      <div className="space-y-2">
        <div className="h-4 w-4/5 rounded bg-cx-well" />
        <div className="h-3.5 w-1/3 rounded bg-cx-well" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
