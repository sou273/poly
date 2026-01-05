
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [gameState, setGameState] = useState('IDLE'); // IDLE, LOADING, PLAYING, SCORING, RESULT
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [nativeLanguage, setNativeLanguage] = useState('Japanese');
  const [imageData, setImageData] = useState(null);
  const [userDescription, setUserDescription] = useState('');
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  const startGame = async () => {
    setGameState('LOADING');
    setError(null);
    setUserDescription('');
    setScoreResult(null);
    setImageData(null);

    try {
      const res = await fetch('/api/random-image');
      if (!res.ok) throw new Error('Failed to fetch image');
      const data = await res.json();
      setImageData(data);
      setGameState('PLAYING');
    } catch (err) {
      console.error(err);
      setError('Failed to load image. Please try again.');
      setGameState('IDLE');
    }
  };

  const submitDescription = async () => {
    if (!userDescription.trim()) return;

    setGameState('SCORING');
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDescription,
          originalDescription: imageData.description,
          targetLanguage,
          nativeLanguage
        })
      });

      if (!res.ok) throw new Error('Failed to score result');
      const result = await res.json();
      setScoreResult(result);
      setGameState('RESULT');
    } catch (err) {
      console.error(err);
      setError('Failed to score. Please try again.');
      setGameState('PLAYING');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      submitDescription();
    }
  };

  return (
    <main className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Sparkles className="text-primary" />
          Picture Description
        </h1>
        <p style={{ opacity: 0.8 }}>Describe the random image in your target language!</p>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="card" style={{ background: '#fee2e2', borderColor: '#ef4444', color: '#b91c1c', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      )}

      {/* IDLE STATE */}
      {gameState === 'IDLE' && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>I speak (Native Language):</label>
              <input
                type="text"
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="input-field"
                style={{ maxWidth: '200px', textAlign: 'center', height: 'auto', minHeight: 'unset', padding: '0.5rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>I am learning (Target Language):</label>
              <input
                type="text"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="input-field"
                style={{ maxWidth: '200px', textAlign: 'center', height: 'auto', minHeight: 'unset', padding: '0.5rem' }}
              />
            </div>
          </div>
          <button onClick={startGame} className="btn-primary">
            Start Game
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {gameState === 'LOADING' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '50px', height: '50px', borderWidth: '5px' }}></div>
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>Fetching a random image...</p>
        </div>
      )}

      {/* PLAYING STATE */}
      {(gameState === 'PLAYING' || gameState === 'SCORING' || gameState === 'RESULT') && imageData && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'center', background: 'white' }}>
            <img
              src={imageData.imageUrl}
              alt="Random Irasutoya"
              style={{ maxWidth: '100%', maxHeight: '400px', height: 'auto', borderRadius: '8px' }}
            />
          </div>

          <div className="card">
            {gameState !== 'RESULT' ? (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Describe this image in {targetLanguage}:</h3>
                <textarea
                  ref={inputRef}
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input-field"
                  placeholder={`Type your description in ${targetLanguage}...`}
                  autoFocus
                  disabled={gameState === 'SCORING'}
                />
                <button
                  onClick={submitDescription}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={gameState === 'SCORING' || !userDescription.trim()}
                >
                  {gameState === 'SCORING' ? (
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  ) : (
                    <>
                      Submit Answer <Send size={18} />
                    </>
                  )}
                </button>
              </>
            ) : (
              /* RESULT STATE */
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem' }}>Result</h2>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: scoreResult?.score > 80 ? '#22c55e' : scoreResult?.score > 50 ? '#eab308' : '#ef4444'
                  }}>
                    {scoreResult?.score}/100
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Answer</h4>
                  <p style={{ fontStyle: 'italic', opacity: 0.9 }}>"{userDescription}"</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Feedback ({nativeLanguage})</h4>
                  <p>{scoreResult?.feedback}</p>
                </div>

                {scoreResult?.corrections && scoreResult.corrections.length > 0 && (
                  <div style={{ marginBottom: '1.5rem', background: 'var(--surface-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--foreground)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Better ways to say it:</h4>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {scoreResult.corrections.map((correction, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem', fontStyle: 'italic' }}>
                          "{correction}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Original Japanese Description</h4>
                  <p style={{ background: '#eee', padding: '0.5rem', borderRadius: '4px', display: 'inline-block' }}>{imageData.description}</p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    <a href={imageData.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      View Original Post
                    </a>
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}
                >
                  Next Image <RefreshCw size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
