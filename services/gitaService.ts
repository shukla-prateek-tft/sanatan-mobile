// Bhagavad Gita Sample Data

export interface Verse {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  meaning: string;
}

export interface Chapter {
  number: number;
  name: string;
  nameTransliteration: string;
  meaning: string;
  meaningHindi: string;
  summaryHindi: string;
  summary: string;
  verses: Verse[];
}
export const fetchShlokas = async (
  chapterNumber: number | undefined,
  shlokNumber: number | undefined,
): Promise<Verse[]> => {
  if (!chapterNumber) return [];
  try {
    const response = await fetch(
      `https://vedicscriptures.github.io/slok/${chapterNumber}/${shlokNumber}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const transformed: Verse[] = [
      {
        chapter: data.chapter,
        verse: data.verse,
        sanskrit: data.slok,
        transliteration: data.transliteration,
        translation: data.siva?.et || data.adi?.et || "",
        meaning: data.siva?.ec || "",
        hindi: data.tej?.ht || data.rams?.ht || "",
      },
    ];

    return transformed;
  } catch (error) {
    console.error("Error fetching shlokas:", error);
    return [];
  }
};

export const fetchChapters = async (): Promise<Chapter[]> => {
  try {
    const response = await fetch("https://vedicscriptures.github.io/chapters");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // 🔥 Transform API response into your format
    const transformed: Chapter[] = data.map((item: any) => ({
      number: item.chapter_number,
      name: item.name,
      nameTransliteration: item.translation || item.transliteration || "",
      meaning: item?.meaning?.en || "",
      meaningHindi: item?.meaning?.hi || "",
      summary: item?.summary?.en || "",
      summaryHindi: item?.summary?.hi || "",
      verses: item?.verses_count || 0, // No verses in this endpoint
    }));

    return transformed;
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
};

export const gitaService = {
  async getAllChapters(): Promise<Chapter[]> {
    return await fetchChapters();
  },
  async getShloks(
    chapter: number | undefined,
    shlokNumber: number | undefined,
  ): Promise<Verse[]> {
    return await fetchShlokas(chapter, shlokNumber);
  },
  async getChapter(number: number): Promise<Chapter | undefined> {
    return await fetchChapters()?.then((data) =>
      data.find((ch) => ch.number === number),
    );
  },

  async searchVerses(query: string): Promise<Verse[]> {
    const lowerQuery = query.toLowerCase();
    const results: Verse[] = [];

    await fetchChapters()?.then((data) =>
      data.forEach((chapter) => {
        chapter.verses.forEach((verse) => {
          if (
            verse.sanskrit.toLowerCase().includes(lowerQuery) ||
            verse.transliteration.toLowerCase().includes(lowerQuery) ||
            verse.translation.toLowerCase().includes(lowerQuery) ||
            verse.meaning.toLowerCase().includes(lowerQuery)
          ) {
            results.push(verse);
          }
        });
      }),
    );

    return results;
  },
};
