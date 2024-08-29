import { EMAIL_DOMAIN } from '../constants/configs';

export function extractMessage(message: string) {
  const args = message.replace('\n', ' ').slice('*'.length).trim().split(/ +/);
  if (args.length > 0) {
    return [args.shift().toLowerCase(), args];
  } else return [false, []];
}

export const cleanAndExtractValidWords = (arr) => {
  const validWords = arr.filter((item) => {
    const cleanedItem = item.replace(/[<>@]/g, '');
    return /[a-zA-Zàáạảãăắằẵặẳâấầẩẫậđèéẹẻẽêềếểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳỵỷỹý]/.test(
      cleanedItem,
    );
  });

  return validWords.join(' ');
};

export function generateEmail(userName: string) {
  return `${userName}@${EMAIL_DOMAIN}`;
}

export function getUserNameByEmail(string) {
  if (string.includes(EMAIL_DOMAIN)) {
    return string.slice(0, string.length - 9);
  }
}

export const normalizeString = (str) => {
  return (str || '').trim();
};
