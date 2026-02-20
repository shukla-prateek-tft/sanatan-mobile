// Mantra Service - Daily Mantras and Jap Mantras

export interface Mantra {
  id: string;
  text: string;
  meaning: string;
  deity: string;
}

export const DAILY_MANTRAS: Mantra[] = [
  {
    id: '1',
    text: 'ॐ गं गणपतये नमः',
    meaning: 'Salutations to Lord Ganesha',
    deity: 'Ganesha',
  },
  {
    id: '2',
    text: 'ॐ नमः शिवाय',
    meaning: 'Salutations to Lord Shiva',
    deity: 'Shiva',
  },
  {
    id: '3',
    text: 'ॐ नमो भगवते वासुदेवाय',
    meaning: 'Salutations to Lord Vasudeva (Krishna)',
    deity: 'Krishna',
  },
  {
    id: '4',
    text: 'ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे',
    meaning: 'Salutations to Goddess Chamunda',
    deity: 'Durga',
  },
  {
    id: '5',
    text: 'ॐ श्री रामाय नमः',
    meaning: 'Salutations to Lord Rama',
    deity: 'Rama',
  },
  {
    id: '6',
    text: 'ॐ श्री हनुमते नमः',
    meaning: 'Salutations to Lord Hanuman',
    deity: 'Hanuman',
  },
  {
    id: '7',
    text: 'गायत्री मन्त्र: ॐ भूर्भुवः स्वः',
    meaning: 'The Gayatri Mantra - Universal Prayer',
    deity: 'Savitri',
  },
];

export const JAP_MANTRAS: Mantra[] = [
  ...DAILY_MANTRAS,
  {
    id: '8',
    text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे',
    meaning: 'Hare Krishna Maha Mantra',
    deity: 'Krishna',
  },
  {
    id: '9',
    text: 'ॐ तत्पुरुषाय विद्महे',
    meaning: 'Shiva Gayatri Mantra',
    deity: 'Shiva',
  },
];

export const mantraService = {
  getDailyMantra(): Mantra {
    const today = new Date().getDate();
    const index = today % DAILY_MANTRAS.length;
    return DAILY_MANTRAS[index];
  },

  getAllJapMantras(): Mantra[] {
    return JAP_MANTRAS;
  },
};
