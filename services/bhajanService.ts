// Bhajan Data

export interface Bhajan {
  id: string;
  title: string;
  artist: string;
  deity: 'Shiva' | 'Vishnu' | 'Durga' | 'Krishna' | 'Rama' | 'Ganesha';
  duration: string;
  audioUrl: string; // Placeholder URL
}

export const BHAJANS: Bhajan[] = [
  {
    id: '1',
    title: 'Om Namah Shivaya',
    artist: 'Traditional',
    deity: 'Shiva',
    duration: '5:30',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder
  },
  {
    id: '2',
    title: 'Shri Krishna Govind Hare Murari',
    artist: 'Traditional',
    deity: 'Krishna',
    duration: '4:45',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder
  },
  {
    id: '3',
    title: 'Jai Ambe Gauri',
    artist: 'Traditional',
    deity: 'Durga',
    duration: '6:15',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Placeholder
  },
  {
    id: '4',
    title: 'Om Jai Jagdish Hare',
    artist: 'Traditional',
    deity: 'Vishnu',
    duration: '5:00',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', // Placeholder
  },
  {
    id: '5',
    title: 'Raghupati Raghav Raja Ram',
    artist: 'Traditional',
    deity: 'Rama',
    duration: '4:20',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', // Placeholder
  },
  {
    id: '6',
    title: 'Vakratunda Mahakaya',
    artist: 'Traditional',
    deity: 'Ganesha',
    duration: '3:45',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', // Placeholder
  },
];

export const bhajanService = {
  getAllBhajans(): Bhajan[] {
    return BHAJANS;
  },

  getBhajansByDeity(deity: Bhajan['deity']): Bhajan[] {
    return BHAJANS.filter(b => b.deity === deity);
  },

  getBhajanById(id: string): Bhajan | undefined {
    return BHAJANS.find(b => b.id === id);
  },
};
