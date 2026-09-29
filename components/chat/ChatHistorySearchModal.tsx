import React, { useEffect, useMemo, useState } from 'react';
import type { CharacterProfile, Message } from '../../types';
import { DB } from '../../utils/db';
import { chatMessageFuzzyMatchesKeyword } from '../../utils/chatMessageSearch';
import { isVisibleChatMessage } from '../../utils/chatMessageVisibility';
import Modal from '../os/Modal';

interface Props {
    isOpen: boolean;
    character: CharacterProfile;
    onClose: () => void;
    onJump: (messageId: number) => void;
}

const ChatHistorySearchModal: React.FC<Props> = ({ isOpen, character, onClose, onJump }) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setQuery('');
        setLoading(true);
        DB.getMessagesByCharId(character.id, true)
            .then(rows => { if (!cancelled) setMessages(rows.filter(message => isVisibleChatMessage(message, !!character.hideSystemLogs))); })
            .catch(() => { if (!cancelled) setMessages([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, character.id, character.hideSystemLogs]);

    const matches = useMemo(() => {
        const keyword = query.trim();
        if (!keyword) return [];
        return messages.filter(message => chatMessageFuzzyMatchesKeyword(message, keyword)).slice(-200).reverse();
    }, [messages, query]);

    return (
        <Modal isOpen={isOpen} title="搜索聊天记录" onClose={onClose}>
            <div className="space-y-3">
                <input
                    autoFocus
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="输入关键词查找这段聊天"
                    aria-label="搜索聊天关键词"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="max-h-[48vh] overflow-y-auto space-y-2">
                    {loading ? <p className="py-6 text-center text-sm text-slate-400">正在读取聊天记录…</p>
                        : !query.trim() ? <p className="py-6 text-center text-sm text-slate-400">输入关键词后显示匹配的消息</p>
                        : matches.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">没有找到匹配记录</p>
                        : matches.map(message => (
                            <button
                                key={message.id}
                                onClick={() => onJump(message.id)}
                                className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left hover:border-primary/30 hover:bg-primary/5"
                            >
                                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                                    <span>{message.role === 'user' ? '我' : character.name}</span>
                                    <time>{new Date(message.timestamp).toLocaleString()}</time>
                                </div>
                                <div className="line-clamp-3 break-words text-xs leading-relaxed text-slate-700">{message.content}</div>
                            </button>
                        ))}
                    {matches.length === 200 && <p className="py-2 text-center text-[10px] text-slate-400">仅显示最近 200 条匹配结果</p>}
                </div>
            </div>
        </Modal>
    );
};

export default ChatHistorySearchModal;
