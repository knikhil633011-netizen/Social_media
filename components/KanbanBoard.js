"use client";

import React, { useState, useEffect } from 'react';
import styles from './KanbanBoard.module.css';

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputColor, setInputColor] = useState('yellow');

  useEffect(() => {
    const saved = localStorage.getItem('local_kanban_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem('local_kanban_tasks', JSON.stringify(updated));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTask = {
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      text: inputText.trim(),
      column: 'todo',
      color: inputColor,
      created_at: new Date().toISOString()
    };

    saveTasks([...tasks, newTask]);
    setInputText('');
  };

  const handleDeleteTask = (id) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const moveTask = (id, direction) => {
    const updated = tasks.map(task => {
      if (task.id !== id) return task;
      
      let nextCol = task.column;
      if (task.column === 'todo' && direction === 'right') nextCol = 'in_progress';
      else if (task.column === 'in_progress' && direction === 'left') nextCol = 'todo';
      else if (task.column === 'in_progress' && direction === 'right') nextCol = 'done';
      else if (task.column === 'done' && direction === 'left') nextCol = 'in_progress';
      
      return { ...task, column: nextCol };
    });
    saveTasks(updated);
  };

  const renderColumn = (colName, colTitle, colEmoji) => {
    const colTasks = tasks.filter(t => t.column === colName);
    
    return (
      <div className={`brutal-card ${styles.column}`}>
        <div className={styles.columnHeader}>
          <h4>{colEmoji} {colTitle}</h4>
          <span className={styles.columnCount}>{colTasks.length}</span>
        </div>

        <div className={styles.taskList}>
          {colTasks.length > 0 ? (
            colTasks.map(task => (
              <div 
                key={task.id} 
                className={`${styles.taskCard} ${
                  task.color === 'pink' ? styles.cardPink : 
                  task.color === 'green' ? styles.cardGreen : 
                  task.color === 'blue' ? styles.cardBlue : styles.cardYellow
                }`}
              >
                <p className={styles.taskText}>{task.text}</p>
                <div className={styles.taskActions}>
                  <div className={styles.moveButtons}>
                    {colName !== 'todo' && (
                      <button 
                        type="button" 
                        className={styles.moveBtn} 
                        onClick={() => moveTask(task.id, 'left')}
                        title="Move left"
                      >
                        ◀
                      </button>
                    )}
                    {colName !== 'done' && (
                      <button 
                        type="button" 
                        className={styles.moveBtn} 
                        onClick={() => moveTask(task.id, 'right')}
                        title="Move right"
                      >
                        ▶
                      </button>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className={styles.deleteBtn} 
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyColumn}>Empty column</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`brutal-card ${styles.boardCard}`}>
      <h3 className={styles.boardTitle}>📋 Study Kanban Planner</h3>
      
      {/* Task input form */}
      <form onSubmit={handleAddTask} className={styles.addForm}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What study task needs tracking?..."
          maxLength={80}
          className={`brutal-input ${styles.taskInput}`}
        />
        
        <div className={styles.formRow}>
          <div className={styles.colorPicker}>
            {['yellow', 'pink', 'green', 'blue'].map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.colorDot} ${styles['color_' + c]} ${inputColor === c ? styles.activeColor : ''}`}
                onClick={() => setInputColor(c)}
              />
            ))}
          </div>
          <button type="submit" className={`brutal-btn ${styles.submitBtn}`}>
            ➕ Add Task
          </button>
        </div>
      </form>

      {/* Grid columns */}
      <div className={styles.boardGrid}>
        {renderColumn('todo', 'To Do', '📌')}
        {renderColumn('in_progress', 'In Progress', '⚡')}
        {renderColumn('done', 'Completed', '✅')}
      </div>
    </div>
  );
}
