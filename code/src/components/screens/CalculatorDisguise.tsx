import { useState, useCallback, useRef } from 'react';
import { useApp } from '@/lib/appContext';

type Operation = '+' | '-' | '×' | '÷' | null;

// Corner positions for tap sequence
type Corner = 'tl' | 'tr' | 'bl' | 'br';
const SECRET_CORNER_SEQUENCE: Corner[] = ['tl', 'tr', 'bl', 'br'];

export function CalculatorDisguise() {
  const { authenticate, triggerSOS, sosActive, silentMode } = useApp();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  // Corner tap sequence state
  const [cornerSequence, setCornerSequence] = useState<Corner[]>([]);
  const cornerResetTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Long press equals state
  const equalsHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const [isHoldingEquals, setIsHoldingEquals] = useState(false);

  const calculate = useCallback((a: number, b: number, op: Operation): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand]);

  const handleOperation = useCallback((op: Operation) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperation(op);
    setWaitingForOperand(true);
  }, [display, previousValue, operation, calculate]);

  const handleEquals = useCallback(() => {
    const inputValue = parseFloat(display);
    const fullExpression = display;
    
    // Check for secret codes
    // 911 × 911 = triggers SOS
    if (history.length > 0 && history[history.length - 1].includes('911') && fullExpression === '911') {
      triggerSOS(false);
      setDisplay('0');
      setHistory([]);
      setPreviousValue(null);
      setOperation(null);
      return;
    }

    // Check if display is a PIN attempt
    if (display.length >= 4 && display.length <= 6 && /^\d+$/.test(display)) {
      const result = authenticate(display);
      if (result === 'normal' || result === 'distress') {
        setDisplay('0');
        setHistory([]);
        setPreviousValue(null);
        setOperation(null);
        return;
      }
    }
    
    if (operation && previousValue !== null) {
      const result = calculate(previousValue, inputValue, operation);
      const historyEntry = `${previousValue} ${operation} ${inputValue} = ${result}`;
      setHistory(prev => [...prev.slice(-4), historyEntry]);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, operation, previousValue, calculate, authenticate, triggerSOS, history]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const handleAllClear = useCallback(() => {
    handleClear();
    setHistory([]);
  }, [handleClear]);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const handlePlusMinus = useCallback(() => {
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  }, [display]);

  const handlePercent = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  // Corner tap handler for secret access
  const handleCornerTap = useCallback((corner: Corner) => {
    // Reset timer on each tap
    if (cornerResetTimer.current) {
      clearTimeout(cornerResetTimer.current);
    }
    
    const newSequence = [...cornerSequence, corner];
    setCornerSequence(newSequence);
    
    // Check if sequence matches
    const matchesSequence = newSequence.every((c, i) => c === SECRET_CORNER_SEQUENCE[i]);
    
    if (matchesSequence && newSequence.length === SECRET_CORNER_SEQUENCE.length) {
      // Complete sequence - open dashboard
      authenticate(display.length >= 4 ? display : '0000'); // Use dummy if no valid PIN
      setCornerSequence([]);
      return;
    }
    
    if (!matchesSequence) {
      // Wrong sequence - reset
      setCornerSequence([]);
      return;
    }
    
    // Reset sequence after 3 seconds of inactivity
    cornerResetTimer.current = setTimeout(() => {
      setCornerSequence([]);
    }, 3000);
  }, [cornerSequence, authenticate, display]);

  // Long press equals handlers
  const handleEqualsStart = useCallback(() => {
    setIsHoldingEquals(true);
    equalsHoldTimer.current = setTimeout(() => {
      // 5 second hold - open dashboard
      authenticate(display.length >= 4 ? display : '0000');
      setIsHoldingEquals(false);
    }, 5000);
  }, [authenticate, display]);

  const handleEqualsEnd = useCallback(() => {
    setIsHoldingEquals(false);
    if (equalsHoldTimer.current) {
      clearTimeout(equalsHoldTimer.current);
      equalsHoldTimer.current = null;
    }
  }, []);

  const buttons = [
    { label: 'AC', action: handleAllClear, type: 'function' },
    { label: '±', action: handlePlusMinus, type: 'function' },
    { label: '%', action: handlePercent, type: 'function' },
    { label: '÷', action: () => handleOperation('÷'), type: 'operator' },
    { label: '7', action: () => handleNumber('7'), type: 'number' },
    { label: '8', action: () => handleNumber('8'), type: 'number' },
    { label: '9', action: () => handleNumber('9'), type: 'number' },
    { label: '×', action: () => handleOperation('×'), type: 'operator' },
    { label: '4', action: () => handleNumber('4'), type: 'number' },
    { label: '5', action: () => handleNumber('5'), type: 'number' },
    { label: '6', action: () => handleNumber('6'), type: 'number' },
    { label: '-', action: () => handleOperation('-'), type: 'operator' },
    { label: '1', action: () => handleNumber('1'), type: 'number' },
    { label: '2', action: () => handleNumber('2'), type: 'number' },
    { label: '3', action: () => handleNumber('3'), type: 'number' },
    { label: '+', action: () => handleOperation('+'), type: 'operator' },
    { label: '0', action: () => handleNumber('0'), type: 'number', span: 2 },
    { label: '.', action: handleDecimal, type: 'number' },
    { label: '=', action: handleEquals, type: 'operator' },
  ];

  return (
    <div className="min-h-screen bg-calc-bg flex flex-col relative">
      {/* Silent mode indicator (hidden but functional) */}
      {sosActive && silentMode && (
        <div className="fixed top-0 left-0 w-1 h-1 bg-emergency opacity-0" aria-hidden="true" />
      )}

      {/* Corner tap zones (invisible) */}
      <div 
        className="absolute top-0 left-0 w-16 h-16 z-10"
        onClick={() => handleCornerTap('tl')}
      />
      <div 
        className="absolute top-0 right-0 w-16 h-16 z-10"
        onClick={() => handleCornerTap('tr')}
      />
      <div 
        className="absolute bottom-0 left-0 w-16 h-16 z-10"
        onClick={() => handleCornerTap('bl')}
      />
      <div 
        className="absolute bottom-0 right-0 w-16 h-16 z-10"
        onClick={() => handleCornerTap('br')}
      />
      
      {/* Display */}
      <div className="flex-1 flex flex-col justify-end p-6 bg-calc-display">
        {/* History */}
        <div className="mb-4 space-y-1">
          {history.slice(-3).map((entry, i) => (
            <p key={i} className="text-right text-calc-text-muted text-sm font-mono">
              {entry}
            </p>
          ))}
        </div>
        
        {/* Current operation */}
        {operation && previousValue !== null && (
          <p className="text-right text-calc-text-muted text-xl font-mono mb-2">
            {previousValue} {operation}
          </p>
        )}
        
        {/* Main display */}
        <p className="text-right text-calc-text text-6xl font-light font-mono tracking-tight overflow-hidden">
          {display.length > 9 ? parseFloat(display).toExponential(4) : display}
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-[1px] bg-calc-bg p-[1px]">
        {buttons.map((btn, i) => {
          const isEqualsButton = btn.label === '=';
          
          return (
            <button
              key={i}
              onClick={btn.action}
              onMouseDown={isEqualsButton ? handleEqualsStart : undefined}
              onMouseUp={isEqualsButton ? handleEqualsEnd : undefined}
              onMouseLeave={isEqualsButton ? handleEqualsEnd : undefined}
              onTouchStart={isEqualsButton ? handleEqualsStart : undefined}
              onTouchEnd={isEqualsButton ? handleEqualsEnd : undefined}
              className={`
                h-20 text-2xl font-medium transition-colors active:brightness-125
                ${btn.span === 2 ? 'col-span-2' : ''}
                ${btn.type === 'operator' 
                  ? 'bg-calc-operator text-calc-text hover:bg-calc-operator-hover' 
                  : btn.type === 'function'
                  ? 'bg-calc-text-muted/30 text-calc-text hover:bg-calc-text-muted/40'
                  : 'bg-calc-button text-calc-text hover:bg-calc-button-hover'
                }
                ${isEqualsButton && isHoldingEquals ? 'brightness-125' : ''}
              `}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Subtle hint at bottom */}
      <div className="bg-calc-bg px-4 py-2 text-center">
        <p className="text-[10px] text-calc-text-muted/30">
          SafeCalc v1.0
        </p>
      </div>
    </div>
  );
}
