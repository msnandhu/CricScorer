import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './index.css';

    const initialGameState = {
      setup: {
        matchName: '',
        team1: '',
        team2: '',
        overs: 5,
        tossWinner: '',
        tossChoice: 'Bat',
      },
      status: 'SETUP', // SETUP, TOSS, IN_PROGRESS, INNINGS_BREAK, COMPLETED
      currentInnings: 1,
      innings1: null,
      innings2: null,
      ui: { activeTab: 'SCORE' }
    };

    function MatchSetup({ state, setState }) {
      const [setupData, setSetupData] = useState(state.setup);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setSetupData(prev => ({ ...prev, [name]: value }));
      };

      const handleStart = () => {
        if (!setupData.team1 || !setupData.team2) {
          alert('Please enter both team names');
          return;
        }
        if (!setupData.tossWinner) {
          alert('Please select toss winner');
          return;
        }

        // Initialize Innings 1
        const batTeam = setupData.tossChoice === 'Bat' ? setupData.tossWinner : (setupData.tossWinner === setupData.team1 ? setupData.team2 : setupData.team1);
        const bowlTeam = batTeam === setupData.team1 ? setupData.team2 : setupData.team1;

        const newInnings = {
          battingTeam: batTeam,
          bowlingTeam: bowlTeam,
          runs: 0,
          wickets: 0,
          balls: 0,
          extras: { wd: 0, nb: 0, lb: 0, b: 0, total: 0 },
          batters: [], // { id, name, runs, balls, fours, sixes, dismissal }
          bowlers: [], // { id, name, overs, runs, wickets, maidens, dots }
          currentStrikerIdx: -1,
          currentNonStrikerIdx: -1,
          currentBowlerIdx: -1,
          timeline: [], // [[balls in over 1], [balls in over 2]]
          fallOfWickets: [] // { runs, wickets, over, batterName }
        };

        setState(prev => ({
          ...prev,
          setup: setupData,
          status: 'OPENING_PLAYERS', // Need to select openers first
          innings1: newInnings
        }));
      };

      return (
        <div className="screen-container animate-fade-up">
          <h1 className="text-center text-green" style={{fontSize: '2.5rem', marginBottom: '24px'}}>GullyScore 🏏</h1>
          
          <div className="glass-card">
            <h3 style={{marginBottom: '12px'}}>Match Details</h3>
            <div className="flex-col gap-3">
              <input type="text" name="matchName" placeholder="Match Name (e.g. Sunday Final)" value={setupData.matchName} onChange={handleChange} />
              <input type="text" name="team1" placeholder="Team 1 Name" value={setupData.team1} onChange={handleChange} />
              <input type="text" name="team2" placeholder="Team 2 Name" value={setupData.team2} onChange={handleChange} />
              
              <div style={{marginTop: '8px'}}>
                <label className="text-muted" style={{fontSize: '0.9rem'}}>Overs</label>
                <div className="flex-row justify-between" style={{marginTop: '6px'}}>
                  <input type="range" name="overs" min="1" max="50" value={setupData.overs} onChange={handleChange} style={{flex: 1, marginRight: '16px'}} />
                  <span style={{fontSize: '1.2rem', fontWeight: 'bold', width: '30px'}}>{setupData.overs}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{marginBottom: '12px'}}>Toss</h3>
            <div className="flex-col gap-3">
              <select name="tossWinner" value={setupData.tossWinner} onChange={handleChange}>
                <option value="">Select Toss Winner</option>
                {setupData.team1 && <option value={setupData.team1}>{setupData.team1}</option>}
                {setupData.team2 && <option value={setupData.team2}>{setupData.team2}</option>}
              </select>
              
              {setupData.tossWinner && (
                <div className="flex-row gap-3" style={{marginTop: '8px'}}>
                  <button 
                    className={`flex-1 ${setupData.tossChoice === 'Bat' ? 'btn-primary' : 'action-btn'}`}
                    style={{flex: 1}}
                    onClick={() => setSetupData(prev => ({...prev, tossChoice: 'Bat'}))}
                  >Bat</button>
                  <button 
                    className={`flex-1 ${setupData.tossChoice === 'Bowl' ? 'btn-primary' : 'action-btn'}`}
                    style={{flex: 1}}
                    onClick={() => setSetupData(prev => ({...prev, tossChoice: 'Bowl'}))}
                  >Bowl</button>
                </div>
              )}
            </div>
          </div>

          <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={handleStart}>
            Start Match
          </button>
        </div>
      );
    }

    function OpeningPlayers({ state, setState }) {
      const [striker, setStriker] = useState('');
      const [nonStriker, setNonStriker] = useState('');
      const [bowler, setBowler] = useState('');

      const innings = state.currentInnings === 1 ? state.innings1 : state.innings2;

      const handleStartInnings = () => {
        if (!striker || !nonStriker || !bowler) {
          alert('Please enter all 3 names');
          return;
        }

        const newBatters = [
          { id: Date.now() + 1, name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null },
          { id: Date.now() + 2, name: nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null }
        ];

        const newBowlers = [
          { id: Date.now() + 3, name: bowler, overs: 0, runs: 0, wickets: 0, maidens: 0, dots: 0 }
        ];

        const updatedInnings = {
          ...innings,
          batters: newBatters,
          bowlers: newBowlers,
          currentStrikerIdx: 0,
          currentNonStrikerIdx: 1,
          currentBowlerIdx: 0,
          timeline: [[]] // start first over
        };

        setState(prev => ({
          ...prev,
          status: 'IN_PROGRESS',
          [state.currentInnings === 1 ? 'innings1' : 'innings2']: updatedInnings
        }));
      };

      return (
        <div className="screen-container animate-fade-up">
          <h2 className="text-center" style={{marginBottom: '24px'}}>Innings {state.currentInnings} Begins</h2>
          
          <div className="glass-card">
            <h3 className="text-green" style={{marginBottom: '12px'}}>{innings.battingTeam} Batting</h3>
            <input type="text" placeholder="Striker Name" value={striker} onChange={e => setStriker(e.target.value)} />
            <input type="text" placeholder="Non-Striker Name" value={nonStriker} onChange={e => setNonStriker(e.target.value)} />
          </div>

          <div className="glass-card">
            <h3 className="text-amber" style={{marginBottom: '12px'}}>{innings.bowlingTeam} Bowling</h3>
            <input type="text" placeholder="Opening Bowler Name" value={bowler} onChange={e => setBowler(e.target.value)} />
          </div>

          <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={handleStartInnings}>
            Play Ball!
          </button>
        </div>
      );
    }

    function InningsTab({ state }) {
      const [viewInnNum, setViewInnNum] = useState(state.currentInnings);
      useEffect(() => { setViewInnNum(state.currentInnings); }, [state.currentInnings]);

      const inn = viewInnNum === 1 ? state.innings1 : state.innings2;
      if (!inn) return null;

      return (
        <div className="animate-fade-up">
          <h2 style={{marginBottom: '16px', textAlign: 'center'}}>Scorecard</h2>
          
          {state.innings2 && (
             <div className="flex-row gap-3" style={{marginBottom: '16px'}}>
               <button className={`flex-1 ${viewInnNum === 1 ? 'btn-primary' : 'action-btn'}`} onClick={() => setViewInnNum(1)}>1st Inn: {state.innings1.battingTeam}</button>
               <button className={`flex-1 ${viewInnNum === 2 ? 'btn-primary' : 'action-btn'}`} onClick={() => setViewInnNum(2)}>2nd Inn: {state.innings2.battingTeam}</button>
             </div>
          )}
          
          <div className="glass-card" style={{padding: '12px'}}>
            <h3 className="text-green" style={{marginBottom: '12px'}}>{inn.battingTeam} Batting</h3>
            <table>
              <thead>
                <tr><th>Batter</th><th className="num-col">R</th><th className="num-col">B</th><th className="num-col">4s</th><th className="num-col">6s</th><th className="num-col">SR</th></tr>
              </thead>
              <tbody>
                {inn.batters.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{fontWeight: 'bold'}}>{b.name}{b.dismissal === null && '*'}</div>
                      <div className="text-muted" style={{fontSize: '0.7rem'}}>{b.dismissal || 'Not Out'}</div>
                    </td>
                    <td className="num-col" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{b.runs}</td>
                    <td className="num-col">{b.balls}</td>
                    <td className="num-col">{b.fours}</td>
                    <td className="num-col">{b.sixes}</td>
                    <td className="num-col">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px'}}>
              <div className="flex-row justify-between">
                <span>Extras</span>
                <span style={{fontWeight: 'bold'}}>{inn.extras.total} <span className="text-muted" style={{fontWeight: 'normal'}}>(W {inn.extras.wd}, NB {inn.extras.nb}, LB {inn.extras.lb}, B {inn.extras.b})</span></span>
              </div>
              <div className="flex-row justify-between" style={{marginTop: '8px', fontSize: '1.2rem'}}>
                <span>Total</span>
                <span style={{fontWeight: 'bold'}}>{inn.runs}/{inn.wickets} <span className="text-muted" style={{fontSize: '1rem', fontWeight: 'normal'}}>({Math.floor(inn.balls / 6)}.{inn.balls % 6} Overs)</span></span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{marginTop: '16px', padding: '12px'}}>
            <h3 className="text-amber" style={{marginBottom: '12px'}}>{inn.bowlingTeam} Bowling</h3>
            <table>
              <thead>
                <tr><th>Bowler</th><th className="num-col">O</th><th className="num-col">M</th><th className="num-col">R</th><th className="num-col">W</th><th className="num-col">Econ</th></tr>
              </thead>
              <tbody>
                {inn.bowlers.map(b => {
                   const oversStr = `${Math.floor(b.overs)}.${Math.round((b.overs % 1) * 6)}`;
                   return (
                     <tr key={b.id}>
                       <td style={{fontWeight: 'bold'}}>{b.name}</td>
                       <td className="num-col">{oversStr}</td>
                       <td className="num-col">{b.maidens}</td>
                       <td className="num-col">{b.runs}</td>
                       <td className="num-col text-green" style={{fontWeight: 'bold'}}>{b.wickets}</td>
                       <td className="num-col">{b.overs ? (b.runs / b.overs).toFixed(2) : '0.00'}</td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    function StatsTab({ state }) {
      const [viewInnNum, setViewInnNum] = useState(state.currentInnings);
      useEffect(() => { setViewInnNum(state.currentInnings); }, [state.currentInnings]);

      const inn = viewInnNum === 1 ? state.innings1 : state.innings2;
      if (!inn) return null;

      const totalFours = inn.batters.reduce((acc, b) => acc + b.fours, 0);
      const totalSixes = inn.batters.reduce((acc, b) => acc + b.sixes, 0);
      const totalDots = inn.bowlers.reduce((acc, b) => acc + b.dots, 0);
      const dotPercentage = inn.balls ? ((totalDots / inn.balls) * 100).toFixed(1) : 0;
      const boundaryRuns = (totalFours * 4) + (totalSixes * 6);
      const boundaryPercentage = inn.runs ? ((boundaryRuns / inn.runs) * 100).toFixed(1) : 0;

      return (
        <div className="animate-fade-up">
           <h2 style={{marginBottom: '16px', textAlign: 'center'}}>Match Stats</h2>
           
           {state.innings2 && (
             <div className="flex-row gap-3" style={{marginBottom: '16px'}}>
               <button className={`flex-1 ${viewInnNum === 1 ? 'btn-primary' : 'action-btn'}`} onClick={() => setViewInnNum(1)}>1st Inn: {state.innings1.battingTeam}</button>
               <button className={`flex-1 ${viewInnNum === 2 ? 'btn-primary' : 'action-btn'}`} onClick={() => setViewInnNum(2)}>2nd Inn: {state.innings2.battingTeam}</button>
             </div>
           )}
           
           <div className="glass-card">
              <h3 style={{marginBottom: '16px'}}>Team Stats ({inn.battingTeam})</h3>
              
              <div className="flex-col gap-3">
                 <div className="flex-row justify-between">
                    <span className="text-muted">Total Boundaries</span>
                    <span style={{fontWeight: 'bold'}}>{totalFours} Fours, {totalSixes} Sixes</span>
                 </div>
                 <div className="flex-row justify-between">
                    <span className="text-muted">Runs from Boundaries</span>
                    <span style={{fontWeight: 'bold'}}>{boundaryRuns} ({boundaryPercentage}%)</span>
                 </div>
                 <div className="flex-row justify-between">
                    <span className="text-muted">Dot Balls</span>
                    <span style={{fontWeight: 'bold'}}>{totalDots} ({dotPercentage}%)</span>
                 </div>
              </div>
           </div>

           <div className="glass-card">
              <h3 style={{marginBottom: '16px'}}>Top Performers</h3>
              
              <h4 className="text-green" style={{marginBottom: '8px'}}>Batting</h4>
              {inn.batters.slice().sort((a,b) => b.runs - a.runs).slice(0, 3).map(b => (
                 <div key={b.id} className="flex-row justify-between" style={{marginBottom: '4px'}}>
                    <span>{b.name}</span>
                    <span style={{fontWeight: 'bold'}}>{b.runs} ({b.balls})</span>
                 </div>
              ))}
              
              <h4 className="text-amber" style={{marginTop: '16px', marginBottom: '8px'}}>Bowling</h4>
              {inn.bowlers.slice().sort((a,b) => b.wickets - a.wickets || a.runs - b.runs).slice(0, 3).map(b => (
                 <div key={b.id} className="flex-row justify-between" style={{marginBottom: '4px'}}>
                    <span>{b.name}</span>
                    <span style={{fontWeight: 'bold'}}>{b.wickets}/{b.runs}</span>
                 </div>
              ))}
           </div>
        </div>
      );
    }

    function GraphsTab({ state }) {
      const canvasRef = React.useRef(null);

      useEffect(() => {
        if (!canvasRef.current || !state.innings1) return;

        const getCumulativeRuns = (inn) => {
          if (!inn) return [];
          let runs = [0];
          let currentRuns = 0;
          
          inn.timeline.forEach((over) => {
             over.forEach(ball => {
                if (['0','1','2','3','4','5','6'].includes(ball)) currentRuns += parseInt(ball);
                else if (ball.includes('WD+') || ball.includes('NB+')) {
                   currentRuns += parseInt(ball.split('+')[1]) + 1;
                } else if (['WD', 'NB', 'LB', 'B'].includes(ball)) {
                   currentRuns += 1;
                }
             });
             runs.push(currentRuns);
          });
          return runs;
        };

        const runs1 = getCumulativeRuns(state.innings1);
        const runs2 = getCumulativeRuns(state.innings2);
        const labels = Array.from({length: Math.max(runs1.length, runs2.length)}, (_, i) => `Ov ${i}`);

        const datasets = [{
          label: `${state.innings1.battingTeam} Runs`,
          data: runs1,
          borderColor: '#FFB300', // Amber
          backgroundColor: 'rgba(255, 179, 0, 0.1)',
          fill: true,
          tension: 0.4
        }];

        if (state.innings2) {
          datasets.push({
            label: `${state.innings2.battingTeam} Runs`,
            data: runs2,
            borderColor: '#00e676', // Neon green
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            fill: true,
            tension: 0.4
          });
        }

        const chart = new Chart(canvasRef.current, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            color: '#fff',
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { grid: { color: 'rgba(255,255,255,0.1)' } }
            },
            plugins: {
               legend: { labels: { color: '#fff' } }
            }
          }
        });

        return () => chart.destroy();
      }, [state]);

      return (
        <div className="animate-fade-up">
           <h2 style={{marginBottom: '16px', textAlign: 'center'}}>Worm Graph</h2>
           <div className="glass-card" style={{padding: '16px 8px'}}>
             <canvas ref={canvasRef}></canvas>
           </div>
        </div>
      );
    }

    function SummaryTab({ state }) {
      const inn1 = state.innings1;
      const inn2 = state.innings2;
      
      let resultText = 'Match In Progress';
      if (inn2 && state.status === 'COMPLETED') {
         if (inn2.runs > inn1.runs) {
            resultText = `${inn2.battingTeam} won by ${10 - inn2.wickets} wickets`;
         } else if (inn1.runs > inn2.runs) {
            resultText = `${inn1.battingTeam} won by ${inn1.runs - inn2.runs} runs`;
         } else {
            resultText = 'Match Tied';
         }
      }

      const generateShareText = () => {
         let text = `--- GullyScore 🏏 ---\n`;
         if(state.setup.matchName) text += `${state.setup.matchName}\n`;
         text += `\n`;
         if(inn1) text += `${inn1.battingTeam}: ${inn1.runs}/${inn1.wickets} (${Math.floor(inn1.balls/6)}.${inn1.balls%6} ov)\n`;
         if(inn2) text += `${inn2.battingTeam}: ${inn2.runs}/${inn2.wickets} (${Math.floor(inn2.balls/6)}.${inn2.balls%6} ov)\n`;
         text += `\nResult: ${resultText}\n\nScored with GullyScore`;
         
         navigator.clipboard.writeText(text).then(() => alert('Scorecard copied to clipboard!'));
      };

      return (
         <div className="animate-fade-up text-center">
            <h1 className="text-green" style={{fontSize: '2.5rem', margin: '24px 0'}}>{resultText}</h1>
            
            <div className="glass-card" style={{padding: '24px'}}>
               <div className="flex-col gap-3">
                  <div className="flex-row justify-between text-muted">
                    <span>{inn1?.battingTeam}</span>
                    <span style={{fontWeight: 'bold', color: 'white', fontSize: '1.2rem'}}>{inn1?.runs}/{inn1?.wickets}</span>
                  </div>
                  <div className="flex-row justify-between text-muted">
                    <span>{inn2?.battingTeam}</span>
                    <span style={{fontWeight: 'bold', color: 'white', fontSize: '1.2rem'}}>{inn2?.runs}/{inn2?.wickets}</span>
                  </div>
               </div>
            </div>
            
            <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={generateShareText}>
               Share Scorecard 📤
            </button>
            <button className="action-btn w-full" style={{marginTop: '12px'}} onClick={() => {
               if(confirm('Start new match?')) {
                  localStorage.removeItem('gullyscore_state');
                  window.location.reload();
               }
            }}>
               New Match
            </button>
         </div>
      );
    }

    function MainApp({ state, setState }) {
      const { ui } = state;
      const setTab = (tab) => setState(prev => ({...prev, ui: {...prev.ui, activeTab: tab}}));

      return (
        <div className="flex-col" style={{height: '100%', position: 'relative'}}>
          <div className="screen-container">
            {ui.activeTab === 'SCORE' && <ScoringTab state={state} setState={setState} />}
            {ui.activeTab === 'INNINGS' && <InningsTab state={state} />}
            {ui.activeTab === 'GRAPHS' && <GraphsTab state={state} />}
            {ui.activeTab === 'STATS' && <StatsTab state={state} />}
            {ui.activeTab === 'SUMMARY' && <SummaryTab state={state} />}
          </div>
          
          <div className="bottom-nav">
            <div className={`nav-item ${ui.activeTab === 'SCORE' ? 'active' : ''}`} onClick={() => setTab('SCORE')}>
              <div className="nav-icon">🏏</div> Score
            </div>
            <div className={`nav-item ${ui.activeTab === 'INNINGS' ? 'active' : ''}`} onClick={() => setTab('INNINGS')}>
              <div className="nav-icon">📋</div> Innings
            </div>
            <div className={`nav-item ${ui.activeTab === 'GRAPHS' ? 'active' : ''}`} onClick={() => setTab('GRAPHS')}>
              <div className="nav-icon">📈</div> Graphs
            </div>
            <div className={`nav-item ${ui.activeTab === 'STATS' ? 'active' : ''}`} onClick={() => setTab('STATS')}>
              <div className="nav-icon">📊</div> Stats
            </div>
            {state.status === 'COMPLETED' && (
               <div className={`nav-item ${ui.activeTab === 'SUMMARY' ? 'active' : ''}`} onClick={() => setTab('SUMMARY')}>
                 <div className="nav-icon">🏆</div> Summary
               </div>
            )}
          </div>
        </div>
      );
    }

    function ScoringTab({ state, setState }) {
      const innings = state.currentInnings === 1 ? state.innings1 : state.innings2;
      const { setup } = state;

      const striker = innings.batters[innings.currentStrikerIdx];
      const nonStriker = innings.batters[innings.currentNonStrikerIdx];
      const bowler = innings.bowlers[innings.currentBowlerIdx];

      const ballsToOvers = (balls) => Math.floor(balls / 6) + '.' + (balls % 6);
      const getSR = (r, b) => b > 0 ? ((r / b) * 100).toFixed(1) : '0.0';
      const getEcon = (r, b) => b > 0 ? (r / (b / 6)).toFixed(2) : '0.00';

      const handleScore = (action) => {
        if (action === 'UNDO') {
          setState(prev => {
            if (prev.history && prev.history.length > 0) {
              const previousState = prev.history[prev.history.length - 1];
              return { ...previousState, history: prev.history.slice(0, -1) };
            }
            return prev;
          });
          return;
        }

        setState(prev => {
          // Save history for undo
          const snapshot = structuredClone(prev);
          delete snapshot.history;
          const history = prev.history ? [...prev.history, snapshot] : [snapshot];
          if(history.length > 10) history.shift(); // Keep last 10 actions

          const currInnKey = prev.currentInnings === 1 ? 'innings1' : 'innings2';
          const inn = structuredClone(prev[currInnKey]);
          let newStatus = prev.status;

          let isLegalBall = true;
          let runsToBatter = 0;
          let runsToTeam = 0;
          let runsToBowler = 0;
          let isWicket = false;
          let extras = { wd: 0, nb: 0, lb: 0, b: 0, total: 0 };
          let isDot = false;

          if (['0','1','2','3','4','5','6'].includes(action)) {
            runsToBatter = parseInt(action);
            runsToTeam = runsToBatter;
            runsToBowler = runsToBatter;
            if (runsToBatter === 0) isDot = true;
          } else if (action === 'W') {
            isWicket = true;
            isDot = true; // functionally a dot for the bowler unless run out
          } else if (action === 'WD') {
            isLegalBall = false; runsToTeam = 1; runsToBowler = 1; extras.wd = 1; extras.total = 1;
          } else if (action === 'NB') {
            isLegalBall = false; runsToTeam = 1; runsToBowler = 1; extras.nb = 1; extras.total = 1;
          } else if (action === 'LB') {
            runsToTeam = 1; extras.lb = 1; extras.total = 1; isDot = true;
          } else if (action === 'B') {
            runsToTeam = 1; extras.b = 1; extras.total = 1; isDot = true;
          } else if (action.startsWith('WD+')) {
            isLegalBall = false;
            let r = parseInt(action.split('+')[1]);
            runsToTeam = 1 + r; runsToBowler = 1 + r; extras.wd = 1 + r; extras.total = 1 + r;
          } else if (action.startsWith('NB+')) {
            isLegalBall = false;
            let r = parseInt(action.split('+')[1]);
            runsToTeam = 1 + r; runsToBowler = 1 + r; runsToBatter = r; extras.nb = 1; extras.total = 1;
          }

          // Update Batter
          let strikerObj = inn.batters[inn.currentStrikerIdx];
          strikerObj.runs += runsToBatter;
          if (isLegalBall || action.startsWith('NB')) {
            strikerObj.balls += 1;
          }
          if (runsToBatter === 4) strikerObj.fours += 1;
          if (runsToBatter === 6) strikerObj.sixes += 1;

          // Update Bowler
          let bowlerObj = inn.bowlers[inn.currentBowlerIdx];
          bowlerObj.runs += runsToBowler;
          if (isLegalBall) bowlerObj.overs += (1/6);
          if (isWicket) bowlerObj.wickets += 1;
          if (isDot) bowlerObj.dots += 1;

          // Update Team
          inn.runs += runsToTeam;
          if (isLegalBall) inn.balls += 1;
          if (isWicket) inn.wickets += 1;
          
          Object.keys(extras).forEach(k => { inn.extras[k] += extras[k]; });

          // Update Timeline
          if (inn.timeline.length === 0) inn.timeline.push([]);
          inn.timeline[inn.timeline.length - 1].push(action);

          // Change Strike logic
          let runsRan = runsToBatter + (extras.lb || 0) + (extras.b || 0);
          if (action.startsWith('WD+')) {
              runsRan += parseInt(action.split('+')[1]);
          }
          let swapStrike = runsRan % 2 !== 0;

          // Over complete
          let overCompleted = isLegalBall && inn.balls % 6 === 0;
          if (overCompleted) {
             swapStrike = !swapStrike; // Strike changes at over end
             inn.timeline.push([]);
             newStatus = 'OVER_COMPLETE';
          }

          if (swapStrike) {
             let temp = inn.currentStrikerIdx;
             inn.currentStrikerIdx = inn.currentNonStrikerIdx;
             inn.currentNonStrikerIdx = temp;
          }

          if (isWicket) {
             inn.fallOfWickets.push({ runs: inn.runs, wickets: inn.wickets, over: ballsToOvers(inn.balls), batterName: strikerObj.name });
             strikerObj.dismissal = 'Out'; // To be detailed
             newStatus = 'WICKET_FALL';
          }

          // Check End of Innings
          if (inn.wickets >= 10 || (inn.balls >= prev.setup.overs * 6)) {
             newStatus = 'INNINGS_BREAK';
             if (prev.currentInnings === 2) newStatus = 'COMPLETED';
          }
          
          // Match Won checking (2nd innings)
          if (prev.currentInnings === 2 && inn.runs > prev.innings1.runs) {
             newStatus = 'COMPLETED';
          }

          return { ...prev, history, status: newStatus, [currInnKey]: inn };
        });
      };

      const currentOver = innings.timeline.length > 0 ? innings.timeline[innings.timeline.length - 1] : [];

      return (
        <div className="animate-fade-up">
          {/* Top Bar */}
          <div className="glass-card text-center" style={{padding: '20px', cursor: 'pointer'}} onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editScore: true}}))}>
            <div className="text-muted" style={{fontSize: '0.9rem', marginBottom: '8px'}}>
              {innings.battingTeam} • Innings {state.currentInnings}
            </div>
            <h1 className="score-display" style={{fontSize: '3.5rem', margin: '0', lineHeight: '1'}}>
              {innings.runs}<span className="text-muted" style={{fontSize: '2rem'}}>/{innings.wickets}</span>
            </h1>
            <div style={{fontSize: '1.2rem', marginTop: '8px', fontWeight: 'bold'}}>
              ({ballsToOvers(innings.balls)})
            </div>
            
            {state.currentInnings === 2 && state.status !== 'COMPLETED' && (
              <div className="text-amber" style={{marginTop: '12px', fontWeight: 'bold'}}>
                Need {Math.max(0, state.innings1.runs + 1 - innings.runs)} off {(setup.overs * 6) - innings.balls} balls
              </div>
            )}
            
            <div className="flex-row justify-between text-muted" style={{marginTop: '16px', fontSize: '0.9rem', padding: '0 10px'}}>
              <span>CRR: {innings.balls > 0 ? (innings.runs / (innings.balls / 6)).toFixed(2) : '0.00'}</span>
              {state.currentInnings === 2 && state.status !== 'COMPLETED' && (
                <span>RRR: {((state.innings1.runs + 1 - innings.runs) / Math.max(0.16, ((setup.overs * 6) - innings.balls) / 6)).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Batters */}
          <div className="flex-row gap-3">
            <div className="glass-card w-full" style={{border: striker ? '1px solid var(--accent-primary)' : '', cursor: 'pointer'}} onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editBatter: 'striker'}}))}>
              <div className="flex-row justify-between" style={{marginBottom: '8px'}}>
                <span style={{fontWeight: 'bold'}}>{striker?.name} {striker && '*'}</span>
              </div>
              <div className="flex-row justify-between">
                <span className="text-green" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{striker?.runs}<span style={{fontSize:'0.9rem', color: 'var(--text-muted)'}}> ({striker?.balls})</span></span>
                <span className="text-muted" style={{fontSize: '0.8rem'}}>SR: {getSR(striker?.runs, striker?.balls)}</span>
              </div>
              <div className="text-muted" style={{fontSize: '0.8rem', marginTop: '4px'}}>
                4s: {striker?.fours} | 6s: {striker?.sixes}
              </div>
            </div>
            
            <div className="glass-card w-full" style={{border: nonStriker ? '1px solid transparent' : '', cursor: 'pointer'}} onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editBatter: 'nonStriker'}}))}>
               <div className="flex-row justify-between" style={{marginBottom: '8px'}}>
                <span>{nonStriker?.name}</span>
              </div>
              <div className="flex-row justify-between">
                <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{nonStriker?.runs}<span style={{fontSize:'0.9rem', color: 'var(--text-muted)'}}> ({nonStriker?.balls})</span></span>
                <span className="text-muted" style={{fontSize: '0.8rem'}}>SR: {getSR(nonStriker?.runs, nonStriker?.balls)}</span>
              </div>
               <div className="text-muted" style={{fontSize: '0.8rem', marginTop: '4px'}}>
                4s: {nonStriker?.fours} | 6s: {nonStriker?.sixes}
              </div>
            </div>
          </div>

          {/* Bowler */}
          <div className="glass-card" style={{cursor: 'pointer'}} onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editBowler: true}}))}>
            <div className="flex-row justify-between">
              <span className="text-amber" style={{fontWeight: 'bold'}}>{bowler?.name} •</span>
              <span style={{fontWeight: 'bold'}}>{bowler?.wickets}-{bowler?.runs} <span className="text-muted">({ballsToOvers(Math.round(bowler?.overs * 6) || 0)})</span></span>
            </div>
            <div className="flex-row justify-between text-muted" style={{fontSize: '0.8rem', marginTop: '8px'}}>
              <span>Econ: {getEcon(bowler?.runs, Math.round(bowler?.overs * 6))}</span>
              <span>Dots: {bowler?.dots}</span>
            </div>
          </div>

          {/* Over Strip */}
          <div className="glass-card" style={{padding: '12px 16px', cursor: 'pointer'}} onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editTimeline: true}}))}>
             <div className="text-muted" style={{fontSize: '0.8rem', marginBottom: '8px'}}>This Over</div>
             <div className="over-strip">
               {currentOver.length === 0 ? <span className="text-muted" style={{fontStyle: 'italic'}}>Waiting for first ball...</span> : 
                 currentOver.map((ball, idx) => (
                   <div key={idx} className={`ball-badge ${['4','6'].includes(ball) ? 'boundary' : ball.includes('W') ? 'wicket' : (ball.includes('wd') || ball.includes('nb')) ? 'extra' : ''}`}>
                     {ball}
                   </div>
                 ))
               }
             </div>
          </div>

          {state.status === 'COMPLETED' ? (
             <div className="glass-card text-center" style={{marginTop: '24px', padding: '24px', border: '1px solid var(--accent-primary)'}}>
               <h2 className="text-green" style={{marginBottom: '12px'}}>Match Completed! 🏆</h2>
               <p className="text-muted" style={{marginBottom: '20px'}}>The innings has concluded. Check the final results.</p>
               <button className="btn-primary w-full" onClick={() => setState(prev => ({...prev, ui: {...prev.ui, activeTab: 'SUMMARY'}}))}>View Match Summary</button>
               <button className="action-btn w-full" style={{marginTop: '12px'}} onClick={() => handleScore('UNDO')} disabled={!state.history || state.history.length === 0}>↩ Undo Last Ball</button>
             </div>
          ) : (
            <>
              {/* Scoring Grid */}
              <div className="scoring-grid">
                <button className="action-btn" onClick={() => handleScore('0')}>0</button>
                <button className="action-btn" onClick={() => handleScore('1')}>1</button>
                <button className="action-btn" onClick={() => handleScore('2')}>2</button>
                <button className="action-btn" onClick={() => handleScore('3')}>3</button>
                
                <button className="action-btn boundary" onClick={() => handleScore('4')}>4</button>
                <button className="action-btn" onClick={() => handleScore('5')}>5</button>
                <button className="action-btn boundary" onClick={() => handleScore('6')}>6</button>
                <button className="action-btn wicket" onClick={() => handleScore('W')}>W</button>
                
                <button className="action-btn extra" onClick={() => handleScore('WD')}>WD</button>
                <button className="action-btn extra" onClick={() => handleScore('NB')}>NB</button>
                <button className="action-btn extra" onClick={() => handleScore('LB')}>LB</button>
                <button className="action-btn extra" onClick={() => handleScore('B')}>B</button>
              </div>
              
              <div className="scoring-grid" style={{marginTop: '12px'}}>
                 <button className="action-btn extra" style={{fontSize: '1rem'}} onClick={() => handleScore('WD+1')}>WD+1</button>
                 <button className="action-btn extra" style={{fontSize: '1rem'}} onClick={() => handleScore('WD+2')}>WD+2</button>
                 <button className="action-btn extra" style={{fontSize: '1rem'}} onClick={() => handleScore('NB+1')}>NB+1</button>
                 <button className="action-btn extra" style={{fontSize: '1rem'}} onClick={() => handleScore('NB+4')}>NB+4</button>
                 <button className="action-btn extra" style={{fontSize: '1rem'}} onClick={() => handleScore('NB+6')}>NB+6</button>
                 <button className="action-btn" style={{fontSize: '1.2rem'}} onClick={() => handleScore('UNDO')} disabled={!state.history || state.history.length === 0}>↩</button>
              </div>
            </>
          )}
        </div>
      );
    }

    function WicketModal({ state, setState }) {
      const [newBatter, setNewBatter] = useState('');
      const [dismissalType, setDismissalType] = useState('Bowled');
      
      const handleNext = () => {
        if (!newBatter) { alert('Enter new batter name'); return; }
        
        const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
        if (state[currInnKey].batters.some(b => b.name.toLowerCase() === newBatter.toLowerCase())) {
          alert('This player has already batted!');
          return;
        }

        setState(prev => {
          const currInnKey = prev.currentInnings === 1 ? 'innings1' : 'innings2';
          const inn = structuredClone(prev[currInnKey]);
          
          // Mark old batter out
          inn.batters[inn.currentStrikerIdx].dismissal = dismissalType;
          
          // Add new batter
          inn.batters.push({ id: Date.now(), name: newBatter, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: null });
          inn.currentStrikerIdx = inn.batters.length - 1;
          
          let nextStatus = 'IN_PROGRESS';
          if (inn.wickets >= 10 || inn.balls >= prev.setup.overs * 6) {
             nextStatus = prev.currentInnings === 1 ? 'INNINGS_BREAK' : 'COMPLETED';
          } else if (inn.balls > 0 && inn.balls % 6 === 0) {
             nextStatus = 'OVER_COMPLETE';
          }
          
          return { ...prev, status: nextStatus, [currInnKey]: inn };
        });
      };

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-danger" style={{marginBottom: '16px'}}>WICKET! 🔥</h2>
            
            <label className="text-muted">Dismissal Type</label>
            <select value={dismissalType} onChange={e => setDismissalType(e.target.value)} style={{marginBottom: '16px'}}>
              <option value="Bowled">Bowled</option>
              <option value="Caught">Caught</option>
              <option value="LBW">LBW</option>
              <option value="Run Out">Run Out</option>
              <option value="Stumped">Stumped</option>
              <option value="Hit Wicket">Hit Wicket</option>
              <option value="Retired">Retired</option>
            </select>
            
            <label className="text-muted">Next Batter</label>
            <input type="text" placeholder="Batter Name" value={newBatter} onChange={e => setNewBatter(e.target.value)} />
            
            <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={handleNext}>Continue</button>
          </div>
        </div>
      );
    }

    function OverCompleteModal({ state, setState }) {
      const [newBowler, setNewBowler] = useState('');
      
      const handleNext = () => {
        if (!newBowler) { alert('Enter next bowler name'); return; }
        
        setState(prev => {
          const currInnKey = prev.currentInnings === 1 ? 'innings1' : 'innings2';
          const inn = structuredClone(prev[currInnKey]);
          
          let bowlerIdx = inn.bowlers.findIndex(b => b.name.toLowerCase() === newBowler.toLowerCase());
          if (bowlerIdx === -1) {
            inn.bowlers.push({ id: Date.now(), name: newBowler, overs: 0, runs: 0, wickets: 0, maidens: 0, dots: 0 });
            bowlerIdx = inn.bowlers.length - 1;
          }
          
          inn.currentBowlerIdx = bowlerIdx;
          
          if (inn.balls >= prev.setup.overs * 6) {
             let newStatus = prev.currentInnings === 1 ? 'INNINGS_BREAK' : 'COMPLETED';
             return { ...prev, status: newStatus, [currInnKey]: inn };
          }
          
          return { ...prev, status: 'IN_PROGRESS', [currInnKey]: inn };
        });
      };

      const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
      const inn = state[currInnKey];
      const prevBowler = inn.bowlers[inn.currentBowlerIdx]?.name;

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-amber" style={{marginBottom: '16px'}}>Over Complete!</h2>
            <p className="text-muted" style={{marginBottom: '16px'}}>Select bowler for the next over.</p>
            
            <label className="text-muted">Next Bowler Name</label>
            <input type="text" placeholder="Bowler Name" value={newBowler} onChange={e => setNewBowler(e.target.value)} />
            {prevBowler && <p className="text-danger" style={{fontSize: '0.8rem', marginTop: '4px'}}>Cannot bowl consecutive overs ({prevBowler})</p>}
            
            <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={handleNext}>Start Next Over</button>
          </div>
        </div>
      );
    }

    function EditScoreModal({ state, setState }) {
      const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
      const inn = state[currInnKey];
      
      const [runs, setRuns] = useState(inn.runs);
      const [wickets, setWickets] = useState(inn.wickets);
      const [balls, setBalls] = useState(inn.balls);

      const handleSave = () => {
         setState(prev => {
            const next = structuredClone(prev);
            next[currInnKey].runs = parseInt(runs) || 0;
            next[currInnKey].wickets = parseInt(wickets) || 0;
            next[currInnKey].balls = parseInt(balls) || 0;
            next.ui.editScore = false;
            return next;
         });
      };

      return (
         <div className="modal-overlay">
           <div className="modal-content">
             <h2 className="text-amber" style={{marginBottom: '16px'}}>Edit Team Score</h2>
             <label className="text-muted">Total Runs</label>
             <input type="number" value={runs} onChange={e => setRuns(e.target.value)} />
             <label className="text-muted">Total Wickets</label>
             <input type="number" value={wickets} onChange={e => setWickets(e.target.value)} />
             <label className="text-muted">Total Legal Balls</label>
             <input type="number" value={balls} onChange={e => setBalls(e.target.value)} />
             
             <div className="flex-row gap-3" style={{marginTop: '24px'}}>
                <button className="action-btn flex-1" onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editScore: false}}))}>Cancel</button>
                <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
             </div>
           </div>
         </div>
      );
    }

    function EditBatterModal({ state, setState }) {
      const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
      const inn = state[currInnKey];
      const isStriker = state.ui.editBatter === 'striker';
      const targetIdx = isStriker ? inn.currentStrikerIdx : inn.currentNonStrikerIdx;
      const batter = inn.batters[targetIdx];
      
      const [name, setName] = useState(batter?.name || '');
      const [runs, setRuns] = useState(batter?.runs || 0);
      const [balls, setBalls] = useState(batter?.balls || 0);
      const [fours, setFours] = useState(batter?.fours || 0);
      const [sixes, setSixes] = useState(batter?.sixes || 0);

      const handleSave = () => {
        if (!name) return;
        setState(prev => {
          const next = structuredClone(prev);
          const tIdx = isStriker ? next[currInnKey].currentStrikerIdx : next[currInnKey].currentNonStrikerIdx;
          next[currInnKey].batters[tIdx] = { ...next[currInnKey].batters[tIdx], name, runs: parseInt(runs)||0, balls: parseInt(balls)||0, fours: parseInt(fours)||0, sixes: parseInt(sixes)||0 };
          next.ui.editBatter = false;
          return next;
        });
      };

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-green" style={{marginBottom: '16px'}}>Edit Batter</h2>
            <label className="text-muted">Batter Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex-row gap-3">
               <div><label className="text-muted">Runs</label><input type="number" value={runs} onChange={e => setRuns(e.target.value)} /></div>
               <div><label className="text-muted">Balls</label><input type="number" value={balls} onChange={e => setBalls(e.target.value)} /></div>
            </div>
            <div className="flex-row gap-3">
               <div><label className="text-muted">4s</label><input type="number" value={fours} onChange={e => setFours(e.target.value)} /></div>
               <div><label className="text-muted">6s</label><input type="number" value={sixes} onChange={e => setSixes(e.target.value)} /></div>
            </div>
            <div className="flex-row gap-3" style={{marginTop: '24px'}}>
               <button className="action-btn flex-1" onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editBatter: false}}))}>Cancel</button>
               <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      );
    }

    function EditBowlerModal({ state, setState }) {
      const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
      const inn = state[currInnKey];
      const bowler = inn.bowlers[inn.currentBowlerIdx];
      
      const [name, setName] = useState(bowler?.name || '');
      const [overs, setOvers] = useState(Math.round(bowler?.overs * 6) || 0); // using balls
      const [runs, setRuns] = useState(bowler?.runs || 0);
      const [wickets, setWickets] = useState(bowler?.wickets || 0);

      const handleSave = () => {
        if (!name) return;
        setState(prev => {
          const next = structuredClone(prev);
          let bIdx = next[currInnKey].currentBowlerIdx;
          next[currInnKey].bowlers[bIdx] = { ...next[currInnKey].bowlers[bIdx], name, overs: parseInt(overs)/6 || 0, runs: parseInt(runs)||0, wickets: parseInt(wickets)||0 };
          next.ui.editBowler = false;
          return next;
        });
      };

      return (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-amber" style={{marginBottom: '16px'}}>Edit Bowler</h2>
            <label className="text-muted">Bowler Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} />
            <div className="flex-row gap-3">
               <div><label className="text-muted">Runs</label><input type="number" value={runs} onChange={e => setRuns(e.target.value)} /></div>
               <div><label className="text-muted">Wickets</label><input type="number" value={wickets} onChange={e => setWickets(e.target.value)} /></div>
            </div>
            <label className="text-muted">Balls Bowled</label>
            <input type="number" value={overs} onChange={e => setOvers(e.target.value)} />
            
            <div className="flex-row gap-3" style={{marginTop: '24px'}}>
               <button className="action-btn flex-1" onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editBowler: false}}))}>Cancel</button>
               <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      );
    }
    
    function EditTimelineModal({ state, setState }) {
      const currInnKey = state.currentInnings === 1 ? 'innings1' : 'innings2';
      const inn = state[currInnKey];
      const lastOverIdx = inn.timeline.length > 0 ? inn.timeline.length - 1 : 0;
      
      const [overStr, setOverStr] = useState(inn.timeline[lastOverIdx]?.join(',') || '');

      const handleSave = () => {
         setState(prev => {
            const next = structuredClone(prev);
            if(next[currInnKey].timeline.length > 0) {
               next[currInnKey].timeline[lastOverIdx] = overStr.split(',').map(s => s.trim()).filter(Boolean);
            }
            next.ui.editTimeline = false;
            return next;
         });
      };
      
      return (
         <div className="modal-overlay">
           <div className="modal-content">
             <h2 className="text-green" style={{marginBottom: '16px'}}>Edit Current Over Balls</h2>
             <p className="text-muted" style={{fontSize: '0.8rem', marginBottom: '8px'}}>Comma separated (e.g. 1,W,wd,4)</p>
             <input type="text" value={overStr} onChange={e => setOverStr(e.target.value)} />
             <div className="flex-row gap-3" style={{marginTop: '24px'}}>
                <button className="action-btn flex-1" onClick={() => setState(prev => ({...prev, ui: {...prev.ui, editTimeline: false}}))}>Cancel</button>
                <button className="btn-primary flex-1" onClick={handleSave}>Save</button>
             </div>
           </div>
         </div>
      );
    }

    function InningsBreak({ state, setState }) {
      const handleStartInnings2 = () => {
         const newInnings = {
          battingTeam: state.innings1.bowlingTeam,
          bowlingTeam: state.innings1.battingTeam,
          runs: 0, wickets: 0, balls: 0,
          extras: { wd: 0, nb: 0, lb: 0, b: 0, total: 0 },
          batters: [], bowlers: [],
          currentStrikerIdx: -1, currentNonStrikerIdx: -1, currentBowlerIdx: -1,
          timeline: [], fallOfWickets: []
        };
        setState(prev => ({ ...prev, status: 'OPENING_PLAYERS', currentInnings: 2, innings2: newInnings }));
      };

      return (
        <div className="screen-container animate-fade-up">
          <h1 className="text-center text-amber" style={{marginTop: '40px'}}>Innings Break</h1>
          <div className="glass-card text-center" style={{marginTop: '24px'}}>
            <h2>{state.innings1.battingTeam}</h2>
            <h1 style={{fontSize: '3rem'}}>{state.innings1.runs}/{state.innings1.wickets}</h1>
            <p className="text-muted">Target for {state.innings1.bowlingTeam}: <strong className="text-green" style={{fontSize: '1.2rem'}}>{state.innings1.runs + 1}</strong></p>
          </div>
          <button className="btn-primary w-full" style={{marginTop: '24px'}} onClick={handleStartInnings2}>Start 2nd Innings</button>
        </div>
      );
    }

    function App() {
      const [state, setState] = useState(() => {
        const saved = localStorage.getItem('gullyscore_state');
        if (saved) {
          try { return JSON.parse(saved); } catch(e) { console.error(e); }
        }
        return initialGameState;
      });

      useEffect(() => {
        localStorage.setItem('gullyscore_state', JSON.stringify(state));
      }, [state]);

      // Render based on status
      if (state.status === 'SETUP') {
        return <MatchSetup state={state} setState={setState} />;
      }
      
      if (state.status === 'OPENING_PLAYERS') {
        return <OpeningPlayers state={state} setState={setState} />;
      }

      if (state.status === 'INNINGS_BREAK') {
        return <InningsBreak state={state} setState={setState} />;
      }

      return (
        <>
          <MainApp state={state} setState={setState} />
          {state.status === 'WICKET_FALL' && <WicketModal state={state} setState={setState} />}
          {state.status === 'OVER_COMPLETE' && <OverCompleteModal state={state} setState={setState} />}
          {state.ui?.editScore && <EditScoreModal state={state} setState={setState} />}
          {state.ui?.editBatter && <EditBatterModal state={state} setState={setState} />}
          {state.ui?.editBowler && <EditBowlerModal state={state} setState={setState} />}
          {state.ui?.editTimeline && <EditTimelineModal state={state} setState={setState} />}
        </>
      );
    }

export default App;