export default function AppLogo() {
    return (
        <>
            <img 
                src="/musicpic.png" 
                alt="Music System Logo" 
                className="h-10 w-10 object-contain rounded-md" 
            />
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold text-lg">
                    Music System
                </span>
            </div>
        </>
    );
}
