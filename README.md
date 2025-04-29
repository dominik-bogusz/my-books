# Instrukcja instalacji i uruchomienia aplikacji MyBooks

## Spis treści

1. [Instalacja środowiska](#instalacja-środowiska)
2. [Konfiguracja projektu](#konfiguracja-projektu)
3. [Uruchomienie aplikacji](#uruchomienie-aplikacji)
4. [Konfiguracja bazy danych Supabase](#konfiguracja-bazy-danych-supabase)
5. [Testowanie aplikacji](#testowanie-aplikacji)
6. [Rozwiązywanie problemów](#rozwiązywanie-problemów)

## Instalacja środowiska

### 1. Instalacja Node.js

Aplikacja wymaga Node.js w wersji 16.x lub nowszej.

**Windows / macOS:**

1. Pobierz i zainstaluj Node.js ze strony [https://nodejs.org/](https://nodejs.org/) (zalecana wersja LTS)
2. Sprawdź, czy instalacja przebiegła pomyślnie, uruchamiając w terminalu/wierszu poleceń:
   ```
   node --version
   npm --version
   ```

**Linux (Ubuntu/Debian):**

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalacja Git

Git jest wymagany do sklonowania repozytorium.

**Windows:**

1. Pobierz i zainstaluj Git ze strony [https://git-scm.com/download/win](https://git-scm.com/download/win)

**macOS:**

```bash
brew install git
```

lub pobierz instalator ze strony [https://git-scm.com/download/mac](https://git-scm.com/download/mac)

**Linux:**

```bash
sudo apt-get install git
```

## Konfiguracja projektu

### 1. Kopiowanie projektu z pendrive'a

1. Skopiuj folder projektu `mybooks` z pendrive'a na dysk lokalny swojego komputera, np. do folderu `Dokumenty` lub dowolnego innego wybranego miejsca.

2. Otwórz terminal (wiersz poleceń) i przejdź do skopiowanego katalogu projektu:

```bash
cd ścieżka/do/katalogu/mybooks
```

Przykład dla Windows:

```bash
cd C:\Users\TwojeImię\Dokumenty\mybooks
```

Przykład dla macOS/Linux:

```bash
cd ~/Documents/mybooks
```

### 2. Instalacja zależności

```bash
npm install
```

Ten proces może potrwać kilka minut, w zależności od szybkości połączenia internetowego.

### 3. Konfiguracja zmiennych środowiskowych

1. Utwórz plik `.env.local` w głównym katalogu projektu
2. Dodaj do niego następujące zmienne:

```
VITE_SUPABASE_URL=twój_url_supabase
VITE_SUPABASE_ANON_KEY=twój_klucz_anonimowy_supabase
VITE_GOOGLE_BOOKS_API_KEY=twój_klucz_google_books_api
```

Szczegóły dotyczące uzyskania tych kluczy znajdziesz w sekcji [Konfiguracja bazy danych Supabase](#konfiguracja-bazy-danych-supabase).

## Uruchomienie aplikacji

### Uruchomienie w trybie deweloperskim

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:5173](http://localhost:5173)

### Budowanie wersji produkcyjnej

```bash
npm run build
```

Skompilowane pliki zostaną umieszczone w katalogu `dist`.

### Uruchomienie wersji produkcyjnej lokalnie

```bash
npm run preview
```

## Konfiguracja bazy danych Supabase

Aplikacja MyBooks korzysta z platformy Supabase jako backendu. Oto jak skonfigurować nowy projekt w Supabase:

### 1. Utworzenie konta i projektu

1. Wejdź na stronę [https://supabase.com/](https://supabase.com/) i załóż konto
2. Utwórz nowy projekt, podając nazwę projektu i hasło do bazy danych (zapamiętaj je!)
3. Wybierz region najbliższy Twojej lokalizacji
4. Poczekaj, aż projekt zostanie utworzony (może to potrwać kilka minut)

### 2. Pobranie kluczy dostępu

1. W panelu administracyjnym Supabase przejdź do zakładki "Settings" > "API"
2. Skopiuj wartości `Project URL` i `anon public` key
3. Wklej te wartości do pliku `.env.local` jako `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`

### 3. Konfiguracja struktury bazy danych

Wykonaj poniższe kroki, aby utworzyć wymagane tabele w bazie danych:

1. Przejdź do sekcji "SQL Editor" w panelu Supabase
2. Utwórz nowy zapytanie i wklej poniższy skrypt SQL:

```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    book_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE public.reading_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    book_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE public.book_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    book_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE public.reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    book_data JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_page INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(user_id, book_id)
);

CREATE TABLE public.exchange_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    book_data JSONB NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('nowa', 'bardzo dobry', 'dobry', 'średni', 'wymaga naprawy')),
    description TEXT,
    exchange_type TEXT NOT NULL CHECK (exchange_type IN ('wymiana', 'wypożyczenie', 'oddanie')),
    location TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.exchange_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_offer_id UUID REFERENCES public.exchange_offers(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('oczekująca', 'zaakceptowana', 'odrzucona', 'zakończona', 'anulowana')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('wymiana', 'wypożyczenie', 'oddanie')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.exchange_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_offer_id UUID REFERENCES public.exchange_offers(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('review', 'favorite', 'reading_list', 'exchange_offer', 'follow')),
    book_id TEXT,
    book_data JSONB,
    related_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('follow', 'like', 'comment', 'exchange_request', 'exchange_status')),
    related_id TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.reading_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    goal_books INTEGER NOT NULL,
    goal_pages INTEGER DEFAULT 0,
    books_read INTEGER DEFAULT 0,
    pages_read INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year)
);

CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET followers_count = followers_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET following_count = following_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET following_count = GREATEST(0, following_count - 1)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_reading_goal_progress(goal_id_param UUID, pages_param INTEGER DEFAULT 0)
RETURNS void AS $$
BEGIN
  UPDATE reading_goals
  SET
    books_read = books_read + 1,
    pages_read = pages_read + pages_param,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = goal_id_param;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

3. Uruchom zapytanie klikając "Run"

### 4. Konfiguracja usługi przechowywania plików (Storage)

1. W panelu Supabase przejdź do zakładki "Storage"
2. Utwórz nowy bucket o nazwie "avatars" (kliknij "Create bucket")
3. Ustaw uprawnienia na "Public" (kliknij "..." obok nazwy bucketa > "Make bucket public")

## Uzyskanie klucza Google Books API

Aby korzystać z Google Books API, potrzebny jest klucz API. Oto jak go uzyskać:

1. Wejdź na stronę [Google Developers Console](https://console.cloud.google.com/)
2. Utwórz nowy klucz
3. Skopiuj wygenerowany klucz API
4. Wklej go do pliku `.env.local` jako `VITE_GOOGLE_BOOKS_API_KEY`
