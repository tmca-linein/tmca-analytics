export const SessionExpired = () => {
    return (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <span className="text-sm font-bold">!</span>
                </div>

                <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                        Session has expired
                    </p>
                    <p className="mt-0.5 text-sm text-amber-800">
                        Please reload the page to continue.
                    </p>
                </div>
            </div>
        </div>

    )
} 