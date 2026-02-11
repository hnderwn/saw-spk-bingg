# Tryout & Learning Recommendation System

A comprehensive React-based application for exam simulation and personalized learning recommendations using the SAW (Simple Additive Weighting) method.

## Features

### For Students (Siswa)

- 🔐 **Authentication**: Secure login and registration
- 📊 **Dashboard**: View exam statistics and history
- 📝 **Tryout System**: Timed exams with multiple categories
- 🎯 **SAW Recommendations**: AI-powered learning priority suggestions
- 📈 **Performance Tracking**: Detailed score breakdowns

### For Admins

- 🎛️ **Question Management**: CRUD operations for exam questions
- 📊 **Reports Dashboard**: Comprehensive exam result analytics
- 👥 **Student Monitoring**: Track student performance

### Technical Features

- ⚡ **React + Vite**: Fast development and build times
- 🎨 **Tailwind CSS**: Modern, responsive UI
- 🔗 **Supabase**: Backend as a Service (Auth + Database)
- 🧮 **SAW Algorithm**: Intelligent learning priority calculation
- 💾 **Local Storage**: Exam state persistence
- 📱 **Responsive Design**: Works on all devices

## Technology Stack

- **Frontend**: React 18, Vite, React Router DOM
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + Real-time)
- **State Management**: React Context + Hooks
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── Exam/           # Exam-specific components
├── pages/              # Page components
│   ├── siswa/          # Student pages
│   └── admin/          # Admin pages
├── context/            # React Context providers
├── lib/                # Utility libraries
│   ├── supabase.js     # Supabase client
│   └── saw.js          # SAW algorithm implementation
├── App.jsx             # Main App component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Installation & Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account (free tier works)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd my-app

# Install dependencies
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Create `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  school TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'siswa')) DEFAULT 'siswa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT CHECK (category IN ('Grammar', 'Vocabulary', 'Reading', 'Cloze')) NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_results table
CREATE TABLE exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  score_total INTEGER CHECK (score_total >= 0 AND score_total <= 100),
  score_grammar INTEGER CHECK (score_grammar >= 0 AND score_grammar <= 100),
  score_vocab INTEGER CHECK (score_vocab >= 0 AND score_vocab <= 100),
  score_reading INTEGER CHECK (score_reading >= 0 AND score_reading <= 100),
  score_cloze INTEGER CHECK (score_cloze >= 0 AND score_cloze <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own results" ON exam_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all results" ON exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own results" ON exam_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Seed Sample Data (Optional)

```bash
# Install dotenv for the seed script
npm install dotenv

# Run the seed script
node seed.js
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### For Students

1. **Register**: Create a new account with your email and details
2. **Dashboard**: View your exam history and statistics
3. **Take Exams**: Choose from available exam packages
4. **View Results**: Get detailed score breakdowns and SAW recommendations

### For Admins

1. **Login**: Use an admin account (role must be set to 'admin' in profiles)
2. **Manage Questions**: Add, edit, or delete exam questions
3. **View Reports**: Monitor student performance and exam statistics

The algorithm recommends focusing on areas with the highest priority scores first.

## Weighted Scoring Logic

Sistem menggunakan metode **Persentase Poin Terbobot (Weighted Percentage)**. Skor akhir tidak hanya dihitung dari jumlah jawaban benar, tetapi berdasarkan bobot poin dari setiap soal yang dijawab.

### Rumus Perhitungan

```
Skor = (Total Poin yang Diraih / Total Poin Maksimal Paket) × 100
```

### Parameter Soal

| Parameter      | Nilai | Deskripsi                                                                         |
| :------------- | :---: | :-------------------------------------------------------------------------------- |
| **Difficulty** | 1 - 3 | Menentukan level CEFR (A1-C2). Berpengaruh pada status SAW (Fondasi vs Lanjutan). |
| **Weight**     | 1 - 3 | Menentukan jumlah poin per soal. Soal sulit memberikan poin lebih besar.          |

---

## Exam Packages

Paket soal dibagi menjadi dua kategori utama untuk membantu siswa mengukur kemahiran dan melakukan latihan terfokus.

### 1. Kategori: Ujian (Diagnostic & Proficiency)

Digunakan untuk menentukan atau memperbarui profil level CEFR dan status SAW secara formal.

| Nama Paket                    | Soal | Waktu  | Isi Konten                                   |
| :---------------------------- | :--: | :----: | :------------------------------------------- |
| **Kickstart Diagnostic**      |  50  | 60 mnt | Campuran semua kategori & tingkat kesulitan. |
| **Basic Mastery (A1-A2)**     |  30  | 40 mnt | Fokus pada penguasaan materi dasar.          |
| **Intermediate Path (B1-B2)** |  30  | 45 mnt | Fokus pada pemahaman konteks menengah.       |
| **Advanced Pro (C1-C2)**      |  30  | 50 mnt | Tantangan tingkat tinggi & akademik.         |

### 2. Kategori: Latihan (Daily & Focused)

Digunakan untuk mengasah kemampuan secara cepat atau memperbaiki area terlemah.

| Nama Paket            | Soal | Waktu  | Fokus Utama                                       |
| :-------------------- | :--: | :----: | :------------------------------------------------ |
| **Daily Speed-Check** |  15  | 20 mnt | Latihan campuran versi lite (cepat).              |
| **Smart Practice**    |  15  | 15 mnt | Automatis ditarik dari area terlemah (Hasil SAW). |
| **Grammar Master**    |  20  | 25 mnt | Fokus 100% pada struktur & tata bahasa.           |
| **Vocab Power**       |  20  | 25 mnt | Fokus 100% pada kosakata & makna kata.            |
| **Reading Pro**       |  15  | 30 mnt | Fokus 100% pada pemahaman bacaan.                 |
| **Cloze Challenge**   |  20  | 25 mnt | Fokus 100% pada teks rumpang.                     |

---

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.jsx`
4. Use existing contexts for state management

### Styling

- Use Tailwind CSS classes
- Follow the existing component patterns
- Maintain responsive design principles

### Database Operations

- Use the `db` object from `lib/supabase.js`
- All database calls include proper error handling
- Row Level Security is enabled for security

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting

1. Build the project
2. Upload `dist/` folder to your hosting provider
3. Configure environment variables

### Environment Variables for Production

Make sure to set the same environment variables in your production environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This is a demonstration project. For production use, consider:

- Adding more robust error handling
- Implementing comprehensive testing
- Adding analytics and monitoring
- Enhancing security measures
- Optimizing for performance
