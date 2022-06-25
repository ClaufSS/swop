
const scopes = () => {
  const fillCycleInst = function(toFill) {
    const pattern = this.pattern;
    const filled = [];
    
    for (let i = 0, pointer = 0; i < 4; i++) {
      if (pattern[i] === '-') {
        filled.push(toFill.at(pointer++));
        continue;
      }
      
      filled.push(pattern[i]);
    }
    return filled;
  }

  
  const mainScope = {
    pattern: ['-','-','-','-'],
    fill: fillCycleInst,
    level: 0,
    length: 0
  }

  // create stack with main scope '----'
  const stack = [mainScope,];

  
  return {
    openScope: pattern => {
      const _pattern = [...pattern];
      const nodeBefore = stack.at(-1);
      let superArg = null;
      let len = 0;
      
      for (let i = 0; i < 4; i++) {
        if (_pattern[i] === '-') {
          superArg = nodeBefore.pattern[i];

          _pattern[i] = superArg;
          len += superArg !== '-';
          continue;
        }
        
        if (_pattern[i] === '*') {
          _pattern[i] = '-';
          continue;
        }
        len++
      }
      
      const node = {
        pattern: _pattern,
        fill: fillCycleInst,
        level: stack.length,
        length: len
      }
      
      stack.push(node);
      return node;
    },
    
    closeScope: () => {
      if(stack.length > 1) stack.pop()
    },
    
    getScope: () => stack.at(-1),
  }
}


const isBlank = char => {
  switch (char) {
    case  ' ': return true;
    case '\n': return true;
    case '\t': return true;
    default:  return false;
  }
}


const isInvalidCharToMarker = char => {
  if (char === undefined) return true;
  
  if (isBlank(char)) return true;
  
  switch (char) {
    case '-':
    case '>':
    case '<':
    case ',':
    case '*':
    case ':':
      return true;
  }
  return false;
}


const parseMotionInst = (() => {
  const tags = ['row', 'column', 'left', 'right', 'up', 'down'];

  return cycleInst => {
    let [gi, lt, li, d] = cycleInst;
    
    gi = parseInt(gi, 10);
    li = parseInt(li, 10);
    lt = tags[lt === 'r' ? 0 : lt === 'c' ? 1 : -1];
    d = tags[d === 'l' ? 2 : d === 'r' ? 3 : d === 'u' ? 4 : d === 'd' ? 5 : -1];
    
    if (!isNaN(gi) && !isNaN(li) && lt && d) {
      return [gi, lt, li, d];
    }
  }
})();


const getMarker = (str, pointer) => {
  let
    markerChars = [],
    marker = null,
    read = false,
    char = null;

  
  do {
    char = str[++pointer];

    if (isInvalidCharToMarker(char)) {
      if (char === ':') { // end marke
        marker = markerChars.join('');
        read = true;
        continue;
      }
      break;
    }

    markerChars.push(char);

  } while (!read);
  
  return {marker, endpointer: ++pointer, read}
}


const getInstructions = (str, pointer, qGrids, gSize, scope) => {
  const scopeLength = scope.length;

  let
    char = null,
    inst = null,
    filled = null,
    error = null,
    declared = null,
    hasBeenRead = [],
    instructions = [],
    read = false,
    stop = false,
    qChars = 0;

  let
    toWaitInstruction = true,
    toWaitReseverdChar = false;


  do {
    const chars = [];

    for (char = str[pointer]; isBlank(char); char = str[++pointer]);

    switch (char) {
      case ':':
      case '<':
      case '>':
      case ',':

        if (toWaitReseverdChar) {
          if (char === ',') {
            toWaitReseverdChar = false;
            toWaitInstruction = true;
            pointer++;
            continue;
          }

          read = true;
          continue;
        }

        if (toWaitInstruction) {
          if (!(scopeLength === 4)) {
            instructions = null;
            stop = true;
            continue;
          } 
        }

      default:
      
        if (char === undefined) {
          read = true;
          continue;
        }
          
        if (toWaitReseverdChar) {
          instructions = null;
          stop = true;
          continue;
        }
    }
    
    for (char = str[pointer]; isBlank(char); char = str[++pointer]);
    
    qChars = 4 - scopeLength;
    declared = str.slice(pointer, pointer + qChars);


    if (hasBeenRead.find(base => base === declared)) {
      error = `duplicated instruction at ${pointer}`;
      instructions = null;
      stop = true;
      continue;
    }


    hasBeenRead.push(declared);
    filled = scope.fill(declared);
    inst = parseMotionInst(filled);


    if (inst === undefined) {
      error = `fail to read intruction ${filled}`;
      instructions = null;
      stop = true;
      continue;
    }


    if (inst[0] > qGrids || inst[2] > gSize) {
      error = `parameters gridID or lineIndex have been exceeded ${filled}, expected: (gridID < ${qGrids}; lineIndex < ${gSize}`;
      instructions = null;
      stop = true;
      continue;
    }
    

    instructions.push(inst);
    pointer += qChars;
    
    toWaitInstruction = false;
    toWaitReseverdChar = true;

  } while (!read && !stop);

  return {instructions, endpointer: pointer, read, error};
}


const getPattern = (() => {
  const tags = ['row', 'column', 'left', 'right', 'up', 'down', '-', '*'];
  
  return (str, pointer) => {
    const [gi, lt, li, d] = str.slice(pointer, pointer + 4);
    
    const evaluation = (
      ((gi === '-' || gi === '*') || !isNaN(parseInt(gi, 10))) &&
      ((li === '-' || li === '*') || !isNaN(parseInt(li, 10))) &&
      (lt === 'r' || lt === 'c' || lt === '-' || lt === '*') &&
      (d === 'l' || d === 'r' || d === 'u' || d === 'd' || d === '-' || d === '*'));
      
    if (evaluation) {
      return {pattern: [gi, lt, li, d], endpointer: pointer + 4, read: true}
    }
    return {pattern: null, endpointer: pointer, read: false}
  }
})();


const interpret = (str, gSize, qGrids) => {

  const _scopes = scopes();
  const spaceName = { };
  const len = str.length;
  
  let
    someError = null,
    read = false,
    char = null,
    pointer = 0;

  
  for (let i = 0; i < len && !someError; i = pointer) {
    char = str[pointer];

    for (; isBlank(char); char = str[++pointer]);
    
    if (char === ':') {
      const scope = _scopes.getScope();
      
      const {marker, endpointer: endMarkerPointer, read: markerIsRead} = getMarker(str, pointer);
      
      if (!markerIsRead) {
        someError = `error reading the marker at ${endMarkerPointer}.\n an unexpected character or end of string, correct and try again`;
        continue;
      }
      
      pointer = endMarkerPointer;

      const {instructions, endpointer, read: cycleIsRead, error: failReadInst} = getInstructions(str, pointer, qGrids, gSize, scope);
      
      if (!cycleIsRead) {
        someError = `error reading the instruction at ${endpointer} - ${failReadInst}`;
        continue;
      }
      
      pointer = endpointer;

      if (spaceName.hasOwnProperty(marker)) {
        someError = `redeclaration of the marker ${marker} at ${pointer}`;
        continue;
      }
      
      spaceName[marker] = instructions;
      continue;
    }
    
    if (char === '<') {
      const {pattern, endpointer, read: patternIsRead} = getPattern(str, ++pointer)
      
      if (!patternIsRead) {
        someError = `error invalid pattern declaration at ${pointer}`;
        continue;
      }
      
      _scopes.openScope(pattern);
      pointer = endpointer;
      continue;
    }
    
    if (char === '>') {
      if (_scopes.getScope().level === 0) {
        someError = `error trying close inexistant scope at ${pointer}`;
        continue;
      }
      
      _scopes.closeScope();
      pointer++;
      continue;
    }

    if (char === undefined) {
      if (_scopes.getScope.level === 0) {

      }
    }

    someError = `unexpected character at ${pointer}`;
  }
  
  return {
    translated: (!someError && spaceName) || {},
    read: !someError,
    error: someError
  }
}


const parseModelType = modelType => {
  switch (modelType) {
    case 'auto':
    case 'cycle-based':
    case 'custom':
      return modelType;
    
    case null:
    case undefined:
      return 'auto';
      
    default:
      return undefined;
  }
}


const readRules = function(rules, gSize, qGrids) {
  const modelType = parseModelType(rules?.ruleModelType);
  const descriptorType = rules?.descriptorType;

  let
    cycles = null,
    triggers = null,
    error = null,
    read = false;


  if (modelType) {

    if (modelType === 'auto') {
      const
        lineTypes = ['row', 'column'],
        directionsInLineType = {
          'row': ['right', 'left'],
          'column': ['up', 'down']
        },
        base = {};

      let qCycles = 0;
      
      for (let gridId = 0; gridId < qGrids; gridId++) {
        for (let lineIndex = 0; lineIndex < gSize; lineIndex++) {

          for (let lineType of lineTypes) {
            for (let direction of directionsInLineType[lineType]) {
              base[`${qCycles++}`] = [[gridId, lineType, lineIndex, direction],];
            }
          }
        }
      }
      
      cycles = triggers = base;
      read = true;
    }

    if (modelType === 'cycle-based') {
      const base = interpret(rules.cycles, gSize, qGrids);

      if (base.read) {
        cycles = triggers = base.translated;
        read = true;
        
      } else {
        error = base.error;
      }
    }

    if (modelType === 'custom') {
      const _cycles = interpret(rules.cycles, gSize, qGrids);
      const _triggers = interpret(rules.triggers, gSize, qGrids);

      if (_cycles.read || _triggers.read) {
        cycles = _cycles.translated;
        triggers = _triggers.translated;
        read = true;

      } else {
        error = (!_cycles.read && _cycles.error) || (!_triggers.read && _triggers.error);
      }

    }

  } else {
    error = `invalid motion ruleModelType (${rules.ruleModelType}), use auto, cycle-based or custom`;
  }

  return {cycles, triggers, read, error};
}



// loops syntax

// pattern =>
//   if have need to define a fixed argument
  
// motion => g+lt+li+d
//   contains abreviations for gridID, lineType, lineID and direction with no separators
//   example:
//     0r2l (gridId: 0, lineType: row, lineID: 2, direction: left)


// statement
//   simple (define line by line)
//     :marker1:motion1-motion2-motion3-motion4-...-motionn
//     :marker2:motion1-motion2-motion3-motion4-...-motionn
//     :marker3:motion1-motion2-motion3-motion4-...-motionn
//     ...
//     :markern:motion1-motion2-motion3-motion4-...-motionn
  
  
//   with patterns (define arguments fixeds to use in motions)
//     <pattern # opening definition of the pattern
//       :marker1:motion1-motion2-motion3-motion4-...-motionn
//       :marker2:motion1-motion2-motion3-motion4-...-motionn
//       :marker3:motion1-motion2-motion3-motion4-...-motionn
//       ...
//       :markern:motion1-motion2-motion3-motion4-...-motionn
//     > # end definition
    
    
//   composed
//     :marker1:motion1-motion2-motion3-motion4-...-motionn
  
//     <pattern # opening definition of the pattern #
//       :marker2:motion1-motion2-motion3-motion4-...-motionn
//       :marker3:motion1-motion2-motion3-motion4-...-motionn
//       ...
//       <pattern # opening an another definition of the pattern #
//         :marker8:motion1-motion2-motion3-motion4-...-motionn
//         :marker9:motion1-motion2-motion3-motion4-...-motionn
//         ...
//       > # end fixes definition #
//     > # end fixes definition #
    
//     :markern:motion1-motion2-motion3-motion4-...-motion

// 2x2
// rules = {
//  cycles: `<0---
//    <-r-l:0:0:1:1>
//    <-r-r:2:0:3:1>
//    <-c-d:4:0:5:1>
//    <-c-u:6:0:7:1>
//  >`,
//
//  triggers: `<0---
//    <-r-l:0:0:1:1>
//    <-r-r:2:0:3:1>
//    <-c-d:4:0:5:1>
//    <-c-u:6:0:7:1>
//  >`,
//
// 3x3
// rules = {
//   cycles: `<0---
//       <-r-l:0:0:1:1:2:2>
//       <-r-r:3:0:4:1:5:2>
//       <-l-d:6:0:7:1:8:2>
//       <-l-u:9:0:a:1:b:2>
//     >
//   `,
//
//   triggers: `<0---
//       <-r-l:0:0:1:1:2:2>
//       <-r-r:3:0:4:1:5:2>
//       <-l-d:6:0:7:1:8:2>
//       <-l-u:9:0:a:1:b:2>
//     >
//   `
// }
//
// 4x4
// rules = {
//   cycles: `<0---
//     <-r-l:0:0:1:1:2:2:3:3>
//     <-r-r:4:0:5:1:6:2:7:3>
//     <-c-d:8:0:9:1:a:2:b:3>
//     <-c-u:c:0:d:1:e:2:f:3>
//   >`,
  
//   triggers: `<0---
//     <-r-l:0:0:1:1:2:2:3:3>
//     <-r-r:4:0:5:1:6:2:7:3>
//     <-c-d:8:0:9:1:a:2:b:3>
//     <-c-u:c:0:d:1:e:2:f:3>
//   >`,
// }
//
// 5x5
// rules = {
//   cycles: `<0---
//       <-r-l:0:0:1:1:2:2:3:3:4:4>
//       <-r-r:5:0:6:1:7:2:8:3:9:4>
//       <-c-d:a:0:b:1:c:2:d:3:e:4>
//       <-c-u:f:0:g:1:h:2:i:3:j:4>
//     >
//   `,

//   triggers: `<0---
//       <-r-l:0:0:1:1:2:2:3:3:4:4>
//       <-r-r:5:0:6:1:7:2:8:3:9:4>
//       <-c-d:a:0:b:1:c:2:d:3:e:4>
//       <-c-u:f:0:g:1:h:2:i:3:j:4>
//     >
//   `
// }