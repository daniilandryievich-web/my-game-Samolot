# 3D Application Agent Pipeline

Ten dokument definiuje pipeline subagentów odpowiedzialnych za wygenerowanie aplikacji 3D na podstawie wymagań zdefiniowanych w pliku `init.md`. Każdy etap przypisany jest do wyspecjalizowanego subagenta.

## Etapy Pipeline'u (Kolejność Wykonywania)

### 1. Starszy Architekt Systemowy (Senior System Architect)
- **Cel:** Analiza pliku `init.md`, wybór technologii (np. Three.js, React Three Fiber, Babylon.js) oraz utworzenie struktury projektu i planu początkowego.
- **Plik instrukcji:** `agents/1_architect.md`
- **Dane wejściowe:** `init.md`
- **Oczekiwany rezultat:** Architektura projektu, skrypt inicjalizujący repozytorium (np. pakiet NPM/Vite), początkowe pliki konfiguracyjne.

### 2. Deweloper Silnika i Sceny (Scene & Engine Developer)
- **Cel:** Konfiguracja podstawowej sceny 3D, kamery, oświetlenia, pętli renderowania oraz ewentualnego silnika fizyki.
- **Plik instrukcji:** `agents/2_scene_dev.md`
- **Dane wejściowe:** Architektura z etapu 1, `init.md`
- **Oczekiwany rezultat działający kod bazowy, na którym można osadzać obiekty (czarna lub skonfigurowana przestrzeń z oświetleniem).

### 3. Deweloper Logiki i Mechaniki (Mechanics Developer)
- **Cel:** Implementacja zachowań obiektów, kontroli przez użytkownika, mechaniki, logiki poruszania się, kolizji.
- **Plik instrukcji:** `agents/3_mechanics_dev.md`
- **Dane wejściowe:** Kod z etapu 1-2, `init.md` (sekcja o mechanikach i gameplay'u).
- **Oczekiwany rezultat:** Działająca mechanika aplikacji (np. poruszanie się modelu statku, interakcje).

### 4. Twórca Środowiska i Assetów 3D (3D Environment Artist / Generator)
- **Cel:** Utworzenie obiektów proceduralnych, siatek, materiałów, shaderów oraz załadowanie / przygotowanie assetów wg opisu w `init.md`.
- **Plik instrukcji:** `agents/4_assets_artist.md`
- **Dane wejściowe:** Kod dewelopera sceny i logiki, `init.md` (sekcja o stronie wizualnej).
- **Oczekiwany rezultat:** Gotowe modele w scenie, tekstury, zaawansowane materiały i efekty cząsteczkowe (particles).

### 5. Deweloper Interfejsu i UX (UI/UX Developer)
- **Cel:** Stworzenie atrakcyjnego i nowoczesnego interfejsu 2D (Overlay), menu, HUD, ekranów ładowania, końcowych statystyk, w sposób responsywny.
- **Plik instrukcji:** `agents/5_ui_dev.md`
- **Dane wejściowe:** Kompletna gra/aplikacja 3D.
- **Oczekiwany rezultat:** Podpięty i reponsywny interfejs użytkownika z naniesioną ładną stylistyką.

### 6. Inspektor QA i Optymalizator (QA & Optimization)
- **Cel:** Weryfikacja działania całości względem `init.md`, profilowanie wydajności, fix bugów wizualnych i logicznych, czyszczenie kodu.
- **Plik instrukcji:** `agents/6_qa_optimizer.md`
- **Dane wejściowe:** Cały stos aplikacji.
- **Oczekiwany rezultat:** Gotowa, zoptymalizowana aplikacja 3D gotowa do wdrożenia.

---

**Uwaga:** Plik `init.md` nie istnieje jeszcze w obecnym katalogu głównym projektu. Upewnij się, że dodasz ten plik przed uruchomieniem pipeline'u agentowego.
