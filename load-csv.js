const fs = require('fs');
const _ = require('lodash');
const shuffleSeed = require('shuffle-seed');

function extractColumns(data, columnNames) {
  const headers = _.first(data);
  const indexes = columnNames.map(columnName => headers.indexOf(columnName));
  return data.map(row => {
    const newRow = [];
    indexes.forEach(idx => newRow.push(row[idx]));
    
    return newRow;
  });
}

function loadCSV(filename, {
  converters = {},
  dataColumns = [],
  labelColumns = [],
  shuffle = true,
  shufflePhrase = 'shufflePhrase',
  splitTest = false,
}) {
  let data = fs.readFileSync(filename, {encoding: 'utf-8'});
  data = data.split('\n').map(row => row.split(','));
  data = data.map(row => _.dropRightWhile(row, val => val === ''));
  
  const headers = _.first(data);
  
  data = data.map((row, idx) => {
    if (idx === 0) {
      return row;
    }
    
    return row.map((element, idx) => {
      if (converters[headers[idx]]) {
        const converted = converters[headers[idx]](element);
        
        return _.isNaN(converted) ? element : converted;
      }
      
      const result = parseFloat(element);
      return _.isNaN(result) ? element : result;
    });
  });
  
  let labels = extractColumns(data, labelColumns);
  data = extractColumns(data, dataColumns);
  
  labels.shift();
  data.shift();
  
  if (shuffle) {
    data = shuffleSeed.shuffle(data, shufflePhrase);
    labels = shuffleSeed.shuffle(labels, shufflePhrase);
  }
  
  if (splitTest) {
    const trainSize = _.isNumber(splitTest) ? splitTest : Math.floor(data.length / 2);
    
    return {
      features: data.slice(0, trainSize),
      labels: labels.slice(0, +trainSize),
      testFeatures: data.slice(trainSize),
      testLabels: labels.slice(+trainSize),
    }
  } else {
    return {
      features: data,
      labels,
    };
  }
}

const { features, labels, testFeatures, testLabels } = loadCSV('data.csv', {
  dataColumns: ['height', 'value'],
  labelColumns: ['passed'],
  shuffle: true,
  splitTest: false,
  converters: {
    passed: val => val === 'TRUE',
  },
});

console.log('features', features);
console.log('labels', labels);
console.log('testFeatures', testFeatures);
console.log('testLabels', testLabels);
