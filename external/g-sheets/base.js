import axios from "axios";
import { writeFileSync } from 'fs';
import { backupAndWriteFile } from "../../utils/file-utils.js";
import 'dotenv/config';


// Function to get counts by grouping values of a key 'k'
export function getCountsByGrouping(arr, key) {
  return arr.reduce((counts, obj) => {
    const keyValue = obj[key];

    // If the key is not in counts, initialize it with count 1
    if (!counts[keyValue]) {
      counts[keyValue] = 1;
    } else {
      // Increment the count if the key is already present
      counts[keyValue]++;
    }

    return counts;
  }, {});
}

const standardizeRank = (rank_field) => {
  if (!rank_field) return '';
  const rank = rank_field.split().join(' ').trim().toLowerCase()
  const ranks = []
  if (rank == '')
    return rank

  // Order sensitive
  const standardizedChairRanks = [
    { key: 'Interim VC', keywords: ["interim vice chair", "interim vicechair", "interim vc"] },
    { key: 'VC', keywords: ["vice chair", "vicechair", "vc"] },
    { key: 'Interim Chair', keywords: ["interim chair"] },
    { key: 'Chair', keywords: ["chair"] }
  ]
  for (const rankInOrder of standardizedChairRanks) {
    if (rankInOrder.keywords.filter((keyword) => rank.includes(keyword)).length > 0) {
      ranks.push(rankInOrder.key);
      break;
    }
  }
  const standardizedDirectorRanks = [
    { key: 'APD', keywords: ["associate program director", "assistant program director"] },
    { key: 'Interim PD', keywords: ["interim program director", "interim pd "] },
    { key: 'PD', keywords: ["program director"] },
  ]
  for (const rankInOrder of standardizedDirectorRanks) {
    if (rankInOrder.keywords.filter((keyword) => rank.includes(keyword)).length > 0) {
      ranks.push(rankInOrder.key);
      break;
    }
  }

  return ranks.join(',')
}

const getIndividualDataObj = (data) => {
  /**
   * 1. Process the rows for fields of interest
   * 2. Standardize Ranks
   * 3. Resolve Duplicates by Full Name.
   */
  const individual_foi = ['program name', 'first name', 'middle initial', 'last name', 'edu level', 'rank', 'title', 'PGY_#']

  const columns = data.shift(); // remove the first element and store it in a variable
  const result = data.reduce((acc, curr) => {
    const obj = {};
    columns.forEach((column, index) => {
      if (column) {
        obj[column.trim().replace(/-/g, '_')] = curr[index];
      }
    });
    const simpleObj = {}
    individual_foi.forEach((field) => {
      simpleObj[field] = obj[field]
    })
    if (simpleObj['program name'] && simpleObj['program name'] !== '' && !simpleObj['program name'].endsWith(' Program')) {
      simpleObj['program name'] += ' Program';
    }

    simpleObj['rank_std'] = standardizeRank(simpleObj.rank);
    const middle = simpleObj["middle initial"] ? ` ${simpleObj["middle initial"]} ` : ' '
    simpleObj['fullName'] = `${simpleObj["first name"]}${middle}${simpleObj["last name"]}`
    const pgyNum = Number(simpleObj["PGY_#"])
    const pgy = (isNaN(pgyNum) || pgyNum > 9) ? -1 : pgyNum;
    simpleObj['PGY_#'] = pgy;
    simpleObj["estimatedYOG"] = estimatedYOG(pgy)
    acc.push(simpleObj);
    // const programName = obj.program_name?.trim();
    // if(programName) {
    //   acc[programName] = obj    
    // }
    return acc;
  }, []);
  //Testing
  //   return getCountsByGrouping(result, 'rank_std');
  return result;
}

const estimatedYOG = (pgy) => {
  if (pgy > 0 && pgy < 10) {
    const currentYear = new Date().getFullYear();
    const yearsToSubtract = pgy + 1;
    const estimatedYOG = currentYear - yearsToSubtract;
    return estimatedYOG;
  } else {
    return -1;
  }
}


// @depricated. check new-base.js
export const resolveDuplicates = (duplicateEntries) => {
  const duplicatesResolved = duplicateEntries.map((entry) => {
    const { count, entries } = entry
    const staticKeys = ['first name', 'middle initial', 'last name', 'fullName'];
    const dynamicKeys = ['program name', 'edu level', 'rank', 'rank_std', 'title', 'PGY_#'];
    const consolidatedEntry = consolidateEntries(entries, staticKeys, dynamicKeys);
    return consolidatedEntry
  });
  return duplicatesResolved
}

const maxString = (str1, str2, mapping) => {
  const num1 = mapping[str1] || -Infinity;
  const num2 = mapping[str2] || -Infinity;
  const maxNum = Math.max(num1, num2);
  return maxNum === -Infinity ? `${str1}|${str2}` : (maxNum === num1) ? str1 : str2;
}

function consolidateEntries(arr, staticKeys, dynamicKeys) {
  const eduLevelMapping = {
    'student': 1,
    'resident': 2,
    'fellow': 3,
    'faculty': 4,
  };

  return arr.reduce((acc, entry) => {
    staticKeys.forEach(key => {
      acc[key] = entry[key];
    });
    dynamicKeys.forEach(key => {

      if (entry[key]) {
        if (key === 'PGY_#') {
          acc[key] = Math.max(acc[key] || -1, entry[key])
        } else if (key === 'edu level') {
          acc[key] = maxString(acc[key], entry[key], eduLevelMapping);
        } else {
          acc[key] = acc[key] && (acc[key] !== entry[key]) ? `${acc[key]}|${entry[key]}` : entry[key];
        }
      }
    });
    return acc;
  }, {});
}

export const getIndividualData = async () => {
  const preparedData = await getManualIndividualData();
  const individuals = identifyDuplicates(preparedData, 'fullName')
  const uniqueIndividuals = individuals.uniqueInds.map(({ entries }) => entries[0])
  const resolvedIndividuals = [...uniqueIndividuals]
  const duplicatesResolved = resolveDuplicates(individuals.duplicateInds)
  resolvedIndividuals.push(...duplicatesResolved);
  return resolvedIndividuals;
}

export const getIndividuals = async () => {
  const result = await getIndividualData();
  const resultWithMeta = {
    count: result.length,
    updateAt: new Date(),
    data: result.slice()
  }
  console.log('Saving raw individual data, just in case...');
  const jsonData = JSON.stringify(resultWithMeta, null, 4);
  // writeFileSync('./.data/individuals.json', jsonData);
  backupAndWriteFile('./.data/individuals.json', jsonData);
  console.log("Downloaded individuals data from google sheets is saved in a file")
  return resultWithMeta;
}

// @depricated. check new-base.js
export const getManualIndividualData = async () => {
  const SHEET_ID = process.env.GSHEET_OLD_INDIVIDUALS_SHEET_ID;
  const DATA_SHEET_NAME = 'all_fac_fel_res'
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${DATA_SHEET_NAME}`;

  const res = await axios.get(url, {
    params: {
      key: API_KEY
    }
  })
    .catch((error) => {
      console.error(error.response.data);
    });
  if (res) {
    return getIndividualDataObj(res.data.values);
  } else {
    return { message: 'Forbidden' };
  }
}

const getProgramDataObj = (data, getKeyField, keyField) => {
  const columns = data.shift(); // remove the first element and store it in a variable
  const result = data.reduce((acc, curr) => {
    const obj = {};
    columns.forEach((column, index) => {
      if (column) {
        obj[column.trim().replace(/-/g, '_')] = curr[index];
      }
    });
    const programId = getKeyField(obj, keyField);
    if (programId) {
      acc[programId] = obj
    }
    return acc;
  }, {});

  return result;
}

export const getGeneralProgramData = async (DATA_SHEET_NAME, getKeyField, keyField) => {
  const SHEET_ID = process.env.GSHEET_PROGRAMDETAILS_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${DATA_SHEET_NAME}`;

  const res = await axios.get(url, {
    params: {
      key: API_KEY
    }
  })
    .catch(error => {
      console.error(error);
    });
  if (res) {
    return getProgramDataObj(res.data.values, getKeyField, keyField);
  } else {
    return { message: 'Forbidden', failed: true };
  }
}

export const getResidencyExplorerProgramData = async () => {
  const DATA_SHEET_NAME = 'ResidencyExplorer'
  const getKeyField = (obj, key) => {
    return obj[key].trim()
  }
  const keyField = 'ACGME residency program code'
  return await getGeneralProgramData(DATA_SHEET_NAME, getKeyField, keyField);
}

export const getAAMCProgramData = async () => {
  const DATA_SHEET_NAME = 'AAMCFREIDA'
  const getKeyField = (obj, key) => {
    return obj[key].trim()
  }
  const keyField = 'Program ID';
  return await getGeneralProgramData(DATA_SHEET_NAME, getKeyField, keyField);
}

export const getManualProgramData = async () => {
  const DATA_SHEET_NAME = 'program-full'
  const getKeyField = (obj, key) => {
    return obj[key]?.split(':')[1]?.trim();
  }
  const keyField = 'program_id';
  return await getGeneralProgramData(DATA_SHEET_NAME, getKeyField, keyField);
}

export const getProgramData = async () => {
  const programsRes = await getManualProgramData();
  if (programsRes.failed) {
    return { failed: true }
  } else {
    const programsWithMeta = {
      count: Object.keys(programsRes).length,
      updatedAt: new Date(),
      data: programsRes
    }
    console.log('Saving raw program data, just in case...');
    const jsonData = JSON.stringify(programsWithMeta, null, 4);
    // writeFileSync('./.data/programs.json', jsonData);
    backupAndWriteFile('./.data/programs.json', jsonData)
    console.log("Downloaded programs data from google sheets is saved in a file")
    return programsWithMeta;
  }
}