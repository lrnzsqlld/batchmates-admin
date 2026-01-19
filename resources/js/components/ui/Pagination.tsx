interface PaginationProps {
    currentPage: number
    lastPage: number
    onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
    const pages = []
    const maxVisible = 5

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(lastPage, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-border rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>

            {start > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="px-3 py-2 border border-border rounded-lg hover:bg-bg-hover"
                    >
                        1
                    </button>
                    {start > 2 && <span className="px-2">...</span>}
                </>
            )}

            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 border rounded-lg ${page === currentPage
                            ? 'bg-primary text-white border-primary'
                            : 'border-border hover:bg-bg-hover'
                        }`}
                >
                    {page}
                </button>
            ))}

            {end < lastPage && (
                <>
                    {end < lastPage - 1 && <span className="px-2">...</span>}
                    <button
                        onClick={() => onPageChange(lastPage)}
                        className="px-3 py-2 border border-border rounded-lg hover:bg-bg-hover"
                    >
                        {lastPage}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-2 border border-border rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    )
}