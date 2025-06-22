interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const dailyQuote = {
    text: "The limits of my language mean the limits of my world.",
    author: "Ludwig Wittgenstein"
  }

  return (
    <footer className={`bg-[#2c3e50] text-white py-6 ${className}`}>
      <div className="container">
        <div className="text-center">
          <blockquote className="italic mb-4">
            "{dailyQuote.text}"
          </blockquote>
          <p className="text-sm text-gray-300">— {dailyQuote.author}</p>
          <p className="mt-4 text-sm text-gray-400">
            © {new Date().getFullYear()} Daily English. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 