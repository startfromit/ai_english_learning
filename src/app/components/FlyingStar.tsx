'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/solid'

interface FlyingStarProps {
  word: string
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
  onComplete: () => void
}

export default function FlyingStar({ word, startPosition, endPosition, onComplete }: FlyingStarProps) {
  const [isVisible, setIsVisible] = useState(true)

  console.log('FlyingStar component rendered with:', { word, startPosition, endPosition })

  useEffect(() => {
    console.log('FlyingStar animation started')
    const timer = setTimeout(() => {
      console.log('FlyingStar animation ending')
      setIsVisible(false)
      setTimeout(() => {
        console.log('FlyingStar animation completed, calling onComplete')
        onComplete()
      }, 300) // 等待动画完成
    }, 800)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: 'fixed',
            left: startPosition.x,
            top: startPosition.y,
            zIndex: 9999,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: endPosition.x - startPosition.x,
            y: endPosition.y - startPosition.y,
            scale: 0.5,
            opacity: 0,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="pointer-events-none"
        >
          <div className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded-full shadow-lg">
            <StarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{word}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 