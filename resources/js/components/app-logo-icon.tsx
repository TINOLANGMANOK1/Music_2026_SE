export default function AppLogoIcon(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            {...props} 
            src="/musicpic.png" 
            alt="Music System Logo" 
            className="h-8 w-8 object-contain"
        />
    );
}
