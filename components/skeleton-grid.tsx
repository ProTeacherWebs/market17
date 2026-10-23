export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index}>
          <div className="aspect-square rounded-[16px] bg-elevated" />
          <div className="mt-3 h-4 w-3/4 rounded-[10px] bg-elevated" />
          <div className="mt-2 h-4 w-1/3 rounded-[10px] bg-elevated" />
        </div>
      ))}
    </div>
  );
}
