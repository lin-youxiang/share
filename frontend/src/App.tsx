import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import axios from 'axios';
import { Camera, Send, X, Copy, Trash2 } from 'lucide-react';

interface Share {
  id: number;
  type: 'text' | 'image';
  content: string;
  created_at: string;
}

export default function App() {
  const [text, setText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 修改前端代码中的 API 地址
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:21108'
    : `http://${window.location.hostname}:21108`;

  // 在 axios 请求中使用
const fetchShares = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/shares`);
      setShares(response.data.reverse());
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching shares:', error);
    }
  };

  useEffect(() => {
    fetchShares();
    const interval = setInterval(fetchShares, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [shares]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text && !file) return;
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (text) {
        formData.append('content', text);
      }

      await axios.post(`${API_BASE_URL}/share`, formData);
      setText('');
      setFile(null);
      fetchShares();
    } catch (error) {
      console.error('Error submitting share:', error);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 对于支持 clipboard API 的现代浏览器
        await navigator.clipboard.writeText(content);
      } else {
        // 后备方案：创建临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('复制失败:', err);
        }
        
        textArea.remove();
      }
    } catch (error) {
      console.error('复制失败:', error);
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/share/${id}`);
      fetchShares();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="space-y-6">
            {shares.map((share) => (
              <div key={share.id}>
                <article className="bg-white rounded-xl shadow-sm p-6 transition duration-200 hover:shadow-md">
                  {share.type === 'text' ? (
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{share.content}</p>
                  ) : (
                    <img 
                      src={`data:image/jpeg;base64,${share.content}`}
                      alt="分享的图片"
                      className="w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <time dateTime={share.created_at}>
                      {new Date(share.created_at).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(share.content)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="复制内容"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(share.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={text}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="写下你想分享的内容..."
                className="w-full resize-none rounded-xl border-2 border-gray-200 p-4 pr-24 outline-none focus:border-blue-500 focus:ring-0 text-gray-700 min-h-[56px]"
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                  />
                  <Camera strokeWidth={1.5} className="w-5 h-5 text-gray-500" />
                </label>
                
                <button 
                  type="submit"
                  disabled={!text && !file}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Send strokeWidth={1.5} className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {file && (
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600 truncate max-w-[80%]">
                  已选择：{file.name}
                </span>
                <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X strokeWidth={1.5} className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      </footer>
    </div>
  );
}