import { useState, useEffect, useCallback } from 'react';
import { Plus, Folder, Check, Clock, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const PRIORITY_CONFIG = {
  CAO:       { label: 'Cao',       color: 'bg-red-100 text-red-600',    dot: 'bg-red-500' },
  'TRUNG BÌNH': { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-600', dot: 'bg-yellow-500' },
  THẤP:      { label: 'Thấp',      color: 'bg-green-100 text-green-600', dot: 'bg-green-500' },
};

const CATEGORIES = ['Công việc', 'Cá nhân', 'Sức khỏe', 'Học tập', 'Khác'];

export default function TodoApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'done'
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('TRUNG BÌNH');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCategory, setNewCategory] = useState('Công việc');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Không thể tải danh sách nhiệm vụ.');
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const isOverdue = (deadline, status) => {
    if (status === 'done' || !deadline) return false;
    const [hours, minutes] = deadline.split(':').map(Number);
    const deadlineTotal = hours * 60 + minutes;
    const currentTotal = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currentTotal > deadlineTotal;
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('todos').insert({
      user_id: user.id,
      title: newTask.trim(),
      priority: newPriority,
      category: newCategory,
      deadline: newDeadline || null,
      status: 'pending',
    }).select().single();

    if (error) {
      setError('Không thể thêm nhiệm vụ.');
    } else {
      setTasks([data, ...tasks]);
      setNewTask('');
      setNewDeadline('');
    }
    setSaving(false);
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    const { error } = await supabase
      .from('todos')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks === 0 ? 0 : (doneTasks / totalTasks) * 100;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách nhiệm vụ</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiến độ hôm nay</p>
            <p className="text-sm text-gray-600 mt-0.5">Hoàn thành <span className="font-bold text-gray-800">{doneTasks}</span> / {totalTasks} nhiệm vụ</p>
          </div>
          <span className="text-2xl font-black text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form thêm nhiệm vụ */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Thêm nhiệm vụ mới</h2>
        <input
          type="text"
          placeholder="Nhập tên nhiệm vụ..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CAO">Ưu tiên: Cao</option>
            <option value="TRUNG BÌNH">Ưu tiên: Trung bình</option>
            <option value="THẤP">Ưu tiên: Thấp</option>
          </select>
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="time"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
            className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={addTask}
          disabled={saving || !newTask.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          {saving
            ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Đang lưu...</>
            : <><Plus size={16} /> Thêm nhiệm vụ</>
          }
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm p-1 gap-1">
          {[{ key: 'all', label: 'Tất cả' }, { key: 'pending', label: 'Đang làm' }, { key: 'done', label: 'Hoàn thành' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={fetchTasks} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="Tải lại">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm">Đang tải nhiệm vụ...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">
            {filter === 'done' ? 'Chưa có nhiệm vụ nào hoàn thành' :
             filter === 'pending' ? 'Không có nhiệm vụ đang chờ' :
             'Chưa có nhiệm vụ nào. Hãy thêm mới!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(task => {
            const overdue = isOverdue(task.deadline, task.status);
            const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['TRUNG BÌNH'];
            return (
              <div
                key={task.id}
                className={`group bg-white rounded-xl border-l-4 shadow-sm p-4 flex items-center gap-3 transition-all hover:shadow-md ${
                  task.status === 'done' ? 'border-l-green-400 opacity-75' :
                  overdue ? 'border-l-red-400 bg-red-50' : 'border-l-blue-400'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStatus(task)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.status === 'done'
                      ? 'border-green-500 bg-green-500 text-white'
                      : overdue
                      ? 'border-red-400 hover:border-red-500'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {task.status === 'done' ? <Check size={12} strokeWidth={3} /> : overdue ? <AlertCircle size={12} className="text-red-500" /> : null}
                </button>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {task.deadline && (
                      <span className={`flex items-center gap-1 ${overdue && task.status !== 'done' ? 'text-red-600 font-medium' : ''}`}>
                        <Clock size={11} />
                        {overdue && task.status !== 'done' ? `Hết hạn: ${task.deadline}` : `Deadline: ${task.deadline}`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Folder size={11} />
                      {task.category}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
