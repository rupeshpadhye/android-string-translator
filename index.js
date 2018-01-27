const translate = require("google-translate-api");
const fs = require("fs");
const xml2js = require("xml2js");
const prompt = require("prompt");
const path = require("path");

function createXmlNodes(json) {
  const xmlNodes = [];
  json.forEach((item) => {
    xmlNodes.push({ _: item.nodeValue, $: { name: item.attributeValue } });
  });
  return xmlNodes;
}
function createJSONToXML(json, destLang) {
  const builder = new xml2js.Builder();
  const obj = { resources: { string: [] } };
  obj.resources.string = createXmlNodes(json);
  const filepath = path.normalize(
      path.join(__dirname, 'strings_'+ destLang +'.xml'),
  );
  //console.log(obj);
  const xml = builder.buildObject(obj);
  fs.writeFile(filepath, xml, (err) => {
    if (err) console.log('error while writing to file',err);
    console.log("language localisation Succesful.");	
  });
}
function translateData(sourceKey, sourceValue, destLang) {
  return new Promise((resolve, reject) => {
    translate(sourceValue, { to: destLang })
          .then((res) => {
            resolve({
              attributeValue: sourceKey,
              nodeValue: res.text,
            });
          })
          .catch((err) => {
            reject(err);
          });
  });
}
function xmlParser(sourceDirectory) {
  const ParsingOutput = [];
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();
    fs.readFile(sourceDirectory, (err, data) => {
      if (err) {
        console.log('error while reading file');
	return;
      }
      parser.parseString(data, (error, result) => {
        if (error) {
          reject(err);
        }
        result.resources.string.forEach((elm) => {
          ParsingOutput.push({
            name: elm.$.name,
            value: elm._,
          });
        });
        resolve(ParsingOutput);
      });
    });
  });
}
function processInput(inputs) {
  if (inputs.filePath === '') {
    inputs.filePath = path.join(__dirname, 'strings.xml');
  }
  if(inputs.destLang === ''){
    inputs.destLang ='hi';	
  } 
		
  console.log('Command-line input received:');
  console.log('file path: ', inputs.filePath);
  console.log('Converting from en to ', inputs.destLang);
  console.log('Please wait ...');
  xmlParser(inputs.filePath).then((parsedXml) => {
    const promises = [];
    parsedXml.forEach((item) => {
      promises.push(translateData(item.name, item.value, inputs.destLang));
    });

    Promise.all(promises).then( (response) => {
      createJSONToXML(response, inputs.destLang);
    }, (err) => {
      console.log(err);
    },
    );
  });
}
prompt.start();
console.log("File Path : path of strings.xml default same directory");
console.log("destLang : destination Language. default hindi");
prompt.get(['filePath', 'destLang'], (err, inputs) => {
  processInput(inputs);
});

