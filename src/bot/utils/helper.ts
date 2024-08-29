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
