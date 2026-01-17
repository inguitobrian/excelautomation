const TIME_STAMP_COLUMN_NAME = "Timestamp";
const FOLDER_ID = ""; // Optional: Google Drive folder ID for uploaded files
const FILE_LINK_COLUMN_NAME = "FileLink";
const UPLOADED_FILE_NAME_COLUMN = "UploadedFileName";
const SUMMARY_SHEET_NAME = "OverallTransaction"; // ✅ Summary sheet name
const ACTUAL_DATE_COLUMN_NAME = "Actual Delivered Date"; // ✅ Column to update with current date when remarks change

function doPost(e) {
try {
const formData = e.postData.contents ? JSON.parse(e.postData.contents) : {};

    // ✅ Handle different actions
    if (formData.action === 'updateRemarks') {
      return handleUpdateRemarks(formData);
    }

    // ✅ Handle batch update action
    if (formData.action === 'batchUpdateRemarks') {
      return handleBatchUpdateRemarks(formData);
    }

    // ✅ Handle RS Number update action
    if (formData.action === 'updateRsNumber') {
      return handleUpdateRsNumber(formData);
    }

    // ✅ Default form submission logic
    return handleFormSubmission(formData);

} catch (error) {
return ContentService.createTextOutput(
JSON.stringify({ status: "error", message: error.toString() })
).setMimeType(ContentService.MimeType.JSON);
}
}

function handleFormSubmission(formData) {
const targetSheetName = formData.sheetName;
if (!targetSheetName) throw new Error("Missing sheetName field");

const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet = spreadsheet.getSheetByName(targetSheetName);
if (!sheet) throw new Error(`Sheet '${targetSheetName}' not found`);

let fileInfo = null;
if (formData.fileData) {
fileInfo = saveFile(formData.fileData);
delete formData.fileData;
}

const timestamp = new Date().toISOString();

const rowData = {
...formData,
[TIME_STAMP_COLUMN_NAME]: timestamp,
};

if (fileInfo) {
rowData[FILE_LINK_COLUMN_NAME] = fileInfo.url;
rowData[UPLOADED_FILE_NAME_COLUMN] = fileInfo.name;
}

delete rowData.sheetName;

// Append to individual sheet
appendToGoogleSheet(rowData, sheet);

// ✅ Also append to summary sheet "Overall Transaction"
const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
if (summarySheet) {
const rowWithSheetName = {
SheetName: targetSheetName, // Add origin sheet name
...rowData
};
appendToGoogleSheet(rowWithSheetName, summarySheet);
}

return ContentService.createTextOutput(
JSON.stringify({ status: "success", message: `Data submitted to '${targetSheetName}' and 'OverallTransaction'.` })
).setMimeType(ContentService.MimeType.JSON);
}
//REMARKS
function handleUpdateRemarks(formData) {
const { sheetName, rsNumber, remarks } = formData;

if (!sheetName || !rsNumber || !remarks) {
throw new Error("Missing required fields: sheetName, rsNumber, or remarks");
}

const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet = spreadsheet.getSheetByName(sheetName);
if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

const data = sheet.getDataRange().getValues();
const headers = data[0];
const rsColumnIndex = headers.indexOf('RS Number');
const remarksColumnIndex = headers.indexOf('Remarks');
const actualDateColumnIndex = headers.indexOf(ACTUAL_DATE_COLUMN_NAME);

if (rsColumnIndex === -1) throw new Error("RS Number column not found");
if (remarksColumnIndex === -1) throw new Error("Remarks column not found");

const normalizedTargetRS = String(rsNumber).trim().toLowerCase();
Logger.log("Target RS Number to update: " + normalizedTargetRS);

let rowFound = false;
for (let i = 1; i < data.length; i++) {
const rowRS = String(data[i][rsColumnIndex]).trim().toLowerCase();
Logger.log(`Row ${i + 1}: RS = '${rowRS}'`);

    if (rowRS === normalizedTargetRS) {
      sheet.getRange(i + 1, remarksColumnIndex + 1).setValue(remarks);

      if (actualDateColumnIndex !== -1) {
        const currentDate = new Date().toLocaleDateString();
        sheet.getRange(i + 1, actualDateColumnIndex + 1).setValue(currentDate);
      }

      rowFound = true;
      break;
    }

}

if (!rowFound) {
throw new Error(`RS Number '${rsNumber}' not found in sheet '${sheetName}'`);
}

const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
if (summarySheet) {
updateRemarksInSummarySheet(summarySheet, rsNumber, remarks, sheetName);
}

return ContentService.createTextOutput(
JSON.stringify({
status: "success",
message: `Remarks updated successfully for RS Number: ${rsNumber}`
})
).setMimeType(ContentService.MimeType.JSON);
}

// ✅ Handle RS Number update
function handleUpdateRsNumber(formData) {
const { sheetName, transactionId, rsNumber } = formData;

if (!sheetName || !transactionId) {
throw new Error("Missing required fields: sheetName or transactionId");
}

const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet = spreadsheet.getSheetByName(sheetName);
if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

const data = sheet.getDataRange().getValues();
const headers = data[0];
const transactionIdColumnIndex = headers.indexOf('Transaction ID');
const rsNumberColumnIndex = headers.indexOf('RS Number');

if (transactionIdColumnIndex === -1) throw new Error("Transaction ID column not found");
if (rsNumberColumnIndex === -1) throw new Error("RS Number column not found");

const normalizedTargetId = String(transactionId).trim().toLowerCase();
Logger.log("Target Transaction ID to update: " + normalizedTargetId);

let rowFound = false;
let oldRsNumber = '';

for (let i = 1; i < data.length; i++) {
const rowId = String(data[i][transactionIdColumnIndex]).trim().toLowerCase();
Logger.log(`Row ${i + 1}: Transaction ID = '${rowId}'`);

if (rowId === normalizedTargetId) {
oldRsNumber = data[i][rsNumberColumnIndex];
sheet.getRange(i + 1, rsNumberColumnIndex + 1).setValue(rsNumber);
rowFound = true;
break;
}
}

if (!rowFound) {
throw new Error(`Transaction ID '${transactionId}' not found in sheet '${sheetName}'`);
}

// ✅ Also update in summary sheet
const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
if (summarySheet) {
updateRsNumberInSummarySheet(summarySheet, transactionId, rsNumber, sheetName);
}

return ContentService.createTextOutput(
JSON.stringify({
status: "success",
message: `RS Number updated successfully from '${oldRsNumber}' to '${rsNumber}'`
})
).setMimeType(ContentService.MimeType.JSON);
}

// ✅ Helper function to update RS Number in summary sheet
function updateRsNumberInSummarySheet(summarySheet, transactionId, rsNumber, originSheetName) {
const data = summarySheet.getDataRange().getValues();
const headers = data[0];
const transactionIdColumnIndex = headers.indexOf('Transaction ID');
const rsNumberColumnIndex = headers.indexOf('RS Number');
const sheetNameColumnIndex = headers.indexOf('SheetName');

if (transactionIdColumnIndex === -1 || rsNumberColumnIndex === -1) return;

for (let i = 1; i < data.length; i++) {
const rowId = String(data[i][transactionIdColumnIndex]).trim().toLowerCase();
const matchesSheet = sheetNameColumnIndex === -1 ||
String(data[i][sheetNameColumnIndex]).trim() === String(originSheetName).trim();

if (rowId === String(transactionId).trim().toLowerCase() && matchesSheet) {
summarySheet.getRange(i + 1, rsNumberColumnIndex + 1).setValue(rsNumber);
break;
}
}
}

// ✅ Helper function to update remarks in summary sheet
function updateRemarksInSummarySheet(summarySheet, rsNumber, remarks, originSheetName) {
const data = summarySheet.getDataRange().getValues();
const headers = data[0];
const rsColumnIndex = headers.indexOf('RS Number');
const remarksColumnIndex = headers.indexOf('Remarks');
const sheetNameColumnIndex = headers.indexOf('SheetName');
const actualDateColumnIndex = headers.indexOf(ACTUAL_DATE_COLUMN_NAME);

if (rsColumnIndex === -1 || remarksColumnIndex === -1) return;

const currentDate = new Date().toLocaleDateString();

for (let i = 1; i < data.length; i++) {
if (
String(data[i][rsColumnIndex]).trim().toLowerCase() === String(rsNumber).trim().toLowerCase() &&
(sheetNameColumnIndex === -1 || String(data[i][sheetNameColumnIndex]).trim() === String(originSheetName).trim())
) {

      // Update remarks
      summarySheet.getRange(i + 1, remarksColumnIndex + 1).setValue(remarks);

      // Update Actual Date if column exists
      if (actualDateColumnIndex !== -1) {
        summarySheet.getRange(i + 1, actualDateColumnIndex + 1).setValue(currentDate);
      }

      break;
    }

}
}

function saveFile(fileData) {
const blob = Utilities.newBlob(
Utilities.base64Decode(fileData.data),
fileData.mimeType,
fileData.fileName
);
const folder = DriveApp.getFolderById(FOLDER_ID);
const file = folder.createFile(blob);
file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
return {
url: `https://drive.google.com/uc?export=view&id=${file.getId()}`,
name: fileData.fileName,
};
}

function appendToGoogleSheet(data, sheet) {
let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

if (headers.length === 0 || headers[0] === "") {
const newHeaders = Object.keys(data);
sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
headers = newHeaders;
}

const rowData = headers.map((header) => data[header] || "");
sheet.appendRow(rowData);
}

// ✅ Returns sheet names or sheet data if ?sheetName=... is passed
function doGet(e) {
const sheetName = e.parameter.sheetName;
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

if (sheetName) {
const sheet = spreadsheet.getSheetByName(sheetName);
if (!sheet) {
return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
.setMimeType(ContentService.MimeType.JSON);
}

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const rows = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify({ rows }))
      .setMimeType(ContentService.MimeType.JSON);

}

const sheets = spreadsheet.getSheets();
const names = sheets.map(s => s.getName());
return ContentService.createTextOutput(
JSON.stringify({ sheets: names })
).setMimeType(ContentService.MimeType.JSON);
}

// ✅ NEW: Utility function to get statistics
function getSheetStatistics(sheetName) {
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet = spreadsheet.getSheetByName(sheetName);
if (!sheet) return null;

const data = sheet.getDataRange().getValues();
const headers = data[0];
const remarksColumnIndex = headers.indexOf('Remarks');

if (remarksColumnIndex === -1) return null;

const stats = {
total: data.length - 1, // Subtract header row
pending: 0,
ongoing: 0,
delivered: 0
};

for (let i = 1; i < data.length; i++) {
const status = data[i][remarksColumnIndex];
if (status === 'Pending') stats.pending++;
else if (status === 'On-going') stats.ongoing++;
else if (status === 'Delivered') stats.delivered++;
}

return stats;
}

function onEdit(e) {
const sheet = e.source.getActiveSheet();
const overallSheetName = 'OverallTransaction'; // Change if needed

const RS_NUMBER_COL = 3; // Column C: RS Number
const REMARKS_COL = 12; // Column L: Remarks
const ACTUAL_DATE_COL = 15; // Column O: Actual Date

const editedCol = e.range.getColumn();
const editedRow = e.range.getRow();

// Skip header row or edits outside the Remarks column
if (editedCol !== REMARKS_COL || editedRow === 1) return;

const newValue = e.value;
const rsNumber = sheet.getRange(editedRow, RS_NUMBER_COL).getValue();
if (!rsNumber) return; // Skip if RS Number is missing

const overallSheet = e.source.getSheetByName(overallSheetName);
if (!overallSheet) return;

const overallData = overallSheet.getRange(2, RS_NUMBER_COL, overallSheet.getLastRow() - 1).getValues();

for (let i = 0; i < overallData.length; i++) {
if (String(overallData[i][0]).trim().toLowerCase() === String(rsNumber).trim().toLowerCase()) {
// Update Remarks in OverallTransaction
overallSheet.getRange(i + 2, REMARKS_COL).setValue(newValue);

      // Only update Actual Date if new status is "Delivered"
      if (newValue.trim().toLowerCase() === "delivered") {
        const currentDate = new Date();
        // Set in both current sheet and summary sheet
        sheet.getRange(editedRow, ACTUAL_DATE_COL).setValue(currentDate);
        overallSheet.getRange(i + 2, ACTUAL_DATE_COL).setValue(currentDate);
      }
      break;
    }

}
}
