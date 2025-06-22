'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogueMessage {
  speaker: string;
  english: string;
  chinese: string;
  timestamp: string;
}

interface Dialogue {
  title: string;
  topic: string;
  participants: string[];
  messages: DialogueMessage[];
}

interface DialoguePanelProps {
  dialogue: Dialogue;
}

const DialoguePanel: React.FC<DialoguePanelProps> = ({ dialogue }) => {
  if (!dialogue.messages || dialogue.messages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto mt-8 overflow-hidden">
      {/* 对话头部 */}
      <div className="bg-green-500 text-white p-4 text-center">
        <h3 className="text-lg font-semibold">{dialogue.title}</h3>
        <p className="text-sm opacity-90 mt-1">{dialogue.topic}</p>
      </div>
      
      {/* 对话内容区域 */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 h-96 overflow-y-auto">
        <div className="space-y-4">
          {dialogue.messages.map((message, index) => (
            <AnimatePresence key={index}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.speaker === dialogue.participants[0] ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.speaker === dialogue.participants[0] ? 'order-1' : 'order-2'}`}>
                  {/* 头像 */}
                  <div className={`flex items-center mb-1 ${message.speaker === dialogue.participants[0] ? 'justify-start' : 'justify-end'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      message.speaker === dialogue.participants[0] 
                        ? 'bg-blue-500' 
                        : 'bg-green-500'
                    }`}>
                      {message.speaker.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs text-gray-500 ml-2 ${message.speaker === dialogue.participants[0] ? 'order-1' : 'order-2'}`}>
                      {message.speaker}
                    </span>
                  </div>
                  
                  {/* 消息气泡 */}
                  <div className={`rounded-lg p-3 ${
                    message.speaker === dialogue.participants[0]
                      ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'bg-green-500 text-white'
                  } shadow-sm`}>
                    <div className="text-sm font-medium mb-1">{message.english}</div>
                    <div className={`text-xs ${
                      message.speaker === dialogue.participants[0]
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-green-100'
                    }`}>
                      {message.chinese}
                    </div>
                  </div>
                  
                  {/* 时间戳 */}
                  <div className={`text-xs text-gray-400 mt-1 ${message.speaker === dialogue.participants[0] ? 'text-left' : 'text-right'}`}>
                    {message.timestamp}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </div>
      
      {/* 对话底部 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>参与者: {dialogue.participants.join(' & ')}</span>
          <span>{dialogue.messages.length} 条消息</span>
        </div>
      </div>
    </div>
  );
};

export default DialoguePanel; 