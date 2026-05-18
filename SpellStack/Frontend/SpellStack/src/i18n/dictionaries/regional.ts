import { en, type Dictionary } from "./en"

type DeepPartial<T> = {
    [Key in keyof T]?: T[Key] extends string ? string : DeepPartial<T[Key]>
}

type DeepPartialDictionary = DeepPartial<Dictionary>

interface CoreCopy {
    save: string
    cancel: string
    delete: string
    edit: string
    play: string
    loading: string
    back: string
    close: string
    reset: string
    filter: string
    create: string
    createDeck: string
    decks: string
    trials: string
    themes: string
    settings: string
    signOut: string
    noMatches: string
    account: string
    gameplay: string
    audio: string
    comfort: string
    privacy: string
}

function mergeDictionary(base: Dictionary, patch: DeepPartialDictionary): Dictionary {
    const output: Record<string, unknown> = { ...base }

    for (const [key, value] of Object.entries(patch)) {
        const baseValue = (base as Record<string, unknown>)[key]
        output[key] = typeof value === "object" && value !== null && typeof baseValue === "object" && baseValue !== null
            ? mergeDictionary(baseValue as Dictionary, value as DeepPartialDictionary)
            : value
    }

    return output as Dictionary
}

function createCoreDictionary(copy: CoreCopy): Dictionary {
    return mergeDictionary(en, {
        common: {
            save: copy.save,
            cancel: copy.cancel,
            delete: copy.delete,
            edit: copy.edit,
            play: copy.play,
            loading: copy.loading,
            back: copy.back,
            close: copy.close,
            reset: copy.reset,
            filter: copy.filter,
            create: copy.create,
            createDeck: copy.createDeck,
            decks: copy.decks,
            trials: copy.trials,
            themes: copy.themes,
            settings: copy.settings,
            signOut: copy.signOut,
            noMatches: copy.noMatches
        },
        nav: {
            decks: copy.decks,
            themes: copy.themes,
            settings: copy.settings,
            signOut: copy.signOut
        },
        deckPage: {
            deckCount: copy.decks,
            noDecksYet: copy.decks,
            filter: {
                allLanguages: copy.filter,
                newest: copy.loading
            }
        },
        settings: {
            title: copy.settings,
            tabs: {
                account: copy.account,
                gameplay: copy.gameplay,
                audio: copy.audio,
                comfort: copy.comfort,
                privacy: copy.privacy
            }
        },
        passwordModal: {
            cancel: copy.cancel,
            closeLabel: copy.close
        }
    })
}

export const regionalDictionaries = {
    sv: createCoreDictionary({ save: "Spara", cancel: "Avbryt", delete: "Ta bort", edit: "Redigera", play: "Spela", loading: "Laddar", back: "Tillbaka", close: "Stäng", reset: "Återställ", filter: "Filter", create: "Skapa", createDeck: "Skapa kortlek", decks: "Kortlekar", trials: "Prövningar", themes: "Teman", settings: "Inställningar", signOut: "Logga ut", noMatches: "Inga träffar", account: "Konto", gameplay: "Spel", audio: "Ljud", comfort: "Komfort", privacy: "Integritet" }),
    da: createCoreDictionary({ save: "Gem", cancel: "Annuller", delete: "Slet", edit: "Rediger", play: "Spil", loading: "Indlæser", back: "Tilbage", close: "Luk", reset: "Nulstil", filter: "Filter", create: "Opret", createDeck: "Opret deck", decks: "Decks", trials: "Prøver", themes: "Temaer", settings: "Indstillinger", signOut: "Log ud", noMatches: "Ingen resultater", account: "Konto", gameplay: "Gameplay", audio: "Lyd", comfort: "Komfort", privacy: "Privatliv" }),
    fi: createCoreDictionary({ save: "Tallenna", cancel: "Peruuta", delete: "Poista", edit: "Muokkaa", play: "Pelaa", loading: "Ladataan", back: "Takaisin", close: "Sulje", reset: "Nollaa", filter: "Suodatin", create: "Luo", createDeck: "Luo pakka", decks: "Pakat", trials: "Kokeet", themes: "Teemat", settings: "Asetukset", signOut: "Kirjaudu ulos", noMatches: "Ei tuloksia", account: "Tili", gameplay: "Pelaaminen", audio: "Ääni", comfort: "Mukavuus", privacy: "Yksityisyys" }),
    is: createCoreDictionary({ save: "Vista", cancel: "Hætta við", delete: "Eyða", edit: "Breyta", play: "Spila", loading: "Hleð", back: "Til baka", close: "Loka", reset: "Endurstilla", filter: "Sía", create: "Búa til", createDeck: "Búa til stokk", decks: "Stokkar", trials: "Prófanir", themes: "Þemu", settings: "Stillingar", signOut: "Skrá út", noMatches: "Engar niðurstöður", account: "Aðgangur", gameplay: "Spilun", audio: "Hljóð", comfort: "Þægindi", privacy: "Persónuvernd" }),
    fr: createCoreDictionary({ save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier", play: "Jouer", loading: "Chargement", back: "Retour", close: "Fermer", reset: "Réinitialiser", filter: "Filtrer", create: "Créer", createDeck: "Créer un deck", decks: "Decks", trials: "Défis", themes: "Thèmes", settings: "Paramètres", signOut: "Déconnexion", noMatches: "Aucun résultat", account: "Compte", gameplay: "Jeu", audio: "Audio", comfort: "Confort", privacy: "Confidentialité" }),
    de: createCoreDictionary({ save: "Speichern", cancel: "Abbrechen", delete: "Löschen", edit: "Bearbeiten", play: "Spielen", loading: "Lädt", back: "Zurück", close: "Schließen", reset: "Zurücksetzen", filter: "Filter", create: "Erstellen", createDeck: "Deck erstellen", decks: "Decks", trials: "Prüfungen", themes: "Themes", settings: "Einstellungen", signOut: "Abmelden", noMatches: "Keine Treffer", account: "Konto", gameplay: "Gameplay", audio: "Audio", comfort: "Komfort", privacy: "Datenschutz" }),
    it: createCoreDictionary({ save: "Salva", cancel: "Annulla", delete: "Elimina", edit: "Modifica", play: "Gioca", loading: "Caricamento", back: "Indietro", close: "Chiudi", reset: "Ripristina", filter: "Filtro", create: "Crea", createDeck: "Crea mazzo", decks: "Mazzi", trials: "Prove", themes: "Temi", settings: "Impostazioni", signOut: "Esci", noMatches: "Nessun risultato", account: "Account", gameplay: "Gameplay", audio: "Audio", comfort: "Comfort", privacy: "Privacy" }),
    pt: createCoreDictionary({ save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", play: "Jogar", loading: "A carregar", back: "Voltar", close: "Fechar", reset: "Repor", filter: "Filtro", create: "Criar", createDeck: "Criar baralho", decks: "Baralhos", trials: "Desafios", themes: "Temas", settings: "Definições", signOut: "Terminar sessão", noMatches: "Sem resultados", account: "Conta", gameplay: "Jogo", audio: "Áudio", comfort: "Conforto", privacy: "Privacidade" }),
    nl: createCoreDictionary({ save: "Opslaan", cancel: "Annuleren", delete: "Verwijderen", edit: "Bewerken", play: "Spelen", loading: "Laden", back: "Terug", close: "Sluiten", reset: "Resetten", filter: "Filter", create: "Maken", createDeck: "Deck maken", decks: "Decks", trials: "Proeven", themes: "Thema's", settings: "Instellingen", signOut: "Uitloggen", noMatches: "Geen resultaten", account: "Account", gameplay: "Gameplay", audio: "Audio", comfort: "Comfort", privacy: "Privacy" }),
    pl: createCoreDictionary({ save: "Zapisz", cancel: "Anuluj", delete: "Usuń", edit: "Edytuj", play: "Graj", loading: "Ładowanie", back: "Wstecz", close: "Zamknij", reset: "Resetuj", filter: "Filtr", create: "Utwórz", createDeck: "Utwórz talię", decks: "Talie", trials: "Próby", themes: "Motywy", settings: "Ustawienia", signOut: "Wyloguj", noMatches: "Brak wyników", account: "Konto", gameplay: "Rozgrywka", audio: "Dźwięk", comfort: "Komfort", privacy: "Prywatność" }),
    cs: createCoreDictionary({ save: "Uložit", cancel: "Zrušit", delete: "Smazat", edit: "Upravit", play: "Hrát", loading: "Načítání", back: "Zpět", close: "Zavřít", reset: "Resetovat", filter: "Filtr", create: "Vytvořit", createDeck: "Vytvořit balíček", decks: "Balíčky", trials: "Zkoušky", themes: "Motivy", settings: "Nastavení", signOut: "Odhlásit", noMatches: "Žádné výsledky", account: "Účet", gameplay: "Hra", audio: "Zvuk", comfort: "Komfort", privacy: "Soukromí" }),
    ru: createCoreDictionary({ save: "Сохранить", cancel: "Отмена", delete: "Удалить", edit: "Изменить", play: "Играть", loading: "Загрузка", back: "Назад", close: "Закрыть", reset: "Сброс", filter: "Фильтр", create: "Создать", createDeck: "Создать колоду", decks: "Колоды", trials: "Испытания", themes: "Темы", settings: "Настройки", signOut: "Выйти", noMatches: "Нет результатов", account: "Аккаунт", gameplay: "Игра", audio: "Звук", comfort: "Комфорт", privacy: "Приватность" }),
    el: createCoreDictionary({ save: "Αποθήκευση", cancel: "Άκυρο", delete: "Διαγραφή", edit: "Επεξεργασία", play: "Παίξε", loading: "Φόρτωση", back: "Πίσω", close: "Κλείσιμο", reset: "Επαναφορά", filter: "Φίλτρο", create: "Δημιουργία", createDeck: "Δημιουργία deck", decks: "Decks", trials: "Δοκιμές", themes: "Θέματα", settings: "Ρυθμίσεις", signOut: "Αποσύνδεση", noMatches: "Δεν βρέθηκαν", account: "Λογαριασμός", gameplay: "Παιχνίδι", audio: "Ήχος", comfort: "Άνεση", privacy: "Απόρρητο" }),
    tr: createCoreDictionary({ save: "Kaydet", cancel: "İptal", delete: "Sil", edit: "Düzenle", play: "Oyna", loading: "Yükleniyor", back: "Geri", close: "Kapat", reset: "Sıfırla", filter: "Filtre", create: "Oluştur", createDeck: "Deste oluştur", decks: "Desteler", trials: "Denemeler", themes: "Temalar", settings: "Ayarlar", signOut: "Çıkış yap", noMatches: "Sonuç yok", account: "Hesap", gameplay: "Oynanış", audio: "Ses", comfort: "Konfor", privacy: "Gizlilik" }),
    uk: createCoreDictionary({ save: "Зберегти", cancel: "Скасувати", delete: "Видалити", edit: "Редагувати", play: "Грати", loading: "Завантаження", back: "Назад", close: "Закрити", reset: "Скинути", filter: "Фільтр", create: "Створити", createDeck: "Створити колоду", decks: "Колоди", trials: "Випробування", themes: "Теми", settings: "Налаштування", signOut: "Вийти", noMatches: "Немає результатів", account: "Акаунт", gameplay: "Гра", audio: "Звук", comfort: "Комфорт", privacy: "Приватність" }),
    zh: createCoreDictionary({ save: "保存", cancel: "取消", delete: "删除", edit: "编辑", play: "开始", loading: "加载中", back: "返回", close: "关闭", reset: "重置", filter: "筛选", create: "创建", createDeck: "创建卡组", decks: "卡组", trials: "试炼", themes: "主题", settings: "设置", signOut: "退出登录", noMatches: "无匹配", account: "账户", gameplay: "玩法", audio: "音频", comfort: "舒适", privacy: "隐私" }),
    ko: createCoreDictionary({ save: "저장", cancel: "취소", delete: "삭제", edit: "편집", play: "플레이", loading: "로딩 중", back: "뒤로", close: "닫기", reset: "초기화", filter: "필터", create: "만들기", createDeck: "덱 만들기", decks: "덱", trials: "시련", themes: "테마", settings: "설정", signOut: "로그아웃", noMatches: "결과 없음", account: "계정", gameplay: "게임플레이", audio: "오디오", comfort: "편의", privacy: "개인정보" }),
    ar: createCoreDictionary({ save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل", play: "لعب", loading: "جار التحميل", back: "رجوع", close: "إغلاق", reset: "إعادة ضبط", filter: "تصفية", create: "إنشاء", createDeck: "إنشاء مجموعة", decks: "المجموعات", trials: "التحديات", themes: "السمات", settings: "الإعدادات", signOut: "تسجيل الخروج", noMatches: "لا توجد نتائج", account: "الحساب", gameplay: "اللعب", audio: "الصوت", comfort: "الراحة", privacy: "الخصوصية" }),
    hi: createCoreDictionary({ save: "सहेजें", cancel: "रद्द करें", delete: "हटाएं", edit: "संपादित करें", play: "खेलें", loading: "लोड हो रहा है", back: "वापस", close: "बंद करें", reset: "रीसेट", filter: "फ़िल्टर", create: "बनाएं", createDeck: "डेक बनाएं", decks: "डेक", trials: "ट्रायल", themes: "थीम", settings: "सेटिंग्स", signOut: "साइन आउट", noMatches: "कोई परिणाम नहीं", account: "खाता", gameplay: "गेमप्ले", audio: "ऑडियो", comfort: "आराम", privacy: "गोपनीयता" }),
    bn: createCoreDictionary({ save: "সংরক্ষণ", cancel: "বাতিল", delete: "মুছুন", edit: "সম্পাদনা", play: "খেলুন", loading: "লোড হচ্ছে", back: "ফিরে যান", close: "বন্ধ", reset: "রিসেট", filter: "ফিল্টার", create: "তৈরি করুন", createDeck: "ডেক তৈরি করুন", decks: "ডেক", trials: "ট্রায়াল", themes: "থিম", settings: "সেটিংস", signOut: "সাইন আউট", noMatches: "কোন ফল নেই", account: "অ্যাকাউন্ট", gameplay: "গেমপ্লে", audio: "অডিও", comfort: "স্বাচ্ছন্দ্য", privacy: "গোপনীয়তা" }),
    he: createCoreDictionary({ save: "שמור", cancel: "ביטול", delete: "מחק", edit: "ערוך", play: "שחק", loading: "טוען", back: "חזרה", close: "סגור", reset: "איפוס", filter: "סינון", create: "צור", createDeck: "צור חפיסה", decks: "חפיסות", trials: "אתגרים", themes: "ערכות נושא", settings: "הגדרות", signOut: "התנתק", noMatches: "אין תוצאות", account: "חשבון", gameplay: "משחק", audio: "שמע", comfort: "נוחות", privacy: "פרטיות" }),
    th: createCoreDictionary({ save: "บันทึก", cancel: "ยกเลิก", delete: "ลบ", edit: "แก้ไข", play: "เล่น", loading: "กำลังโหลด", back: "กลับ", close: "ปิด", reset: "รีเซ็ต", filter: "ตัวกรอง", create: "สร้าง", createDeck: "สร้างเด็ค", decks: "เด็ค", trials: "บททดสอบ", themes: "ธีม", settings: "การตั้งค่า", signOut: "ออกจากระบบ", noMatches: "ไม่พบผลลัพธ์", account: "บัญชี", gameplay: "การเล่น", audio: "เสียง", comfort: "ความสบาย", privacy: "ความเป็นส่วนตัว" }),
    vi: createCoreDictionary({ save: "Lưu", cancel: "Hủy", delete: "Xóa", edit: "Sửa", play: "Chơi", loading: "Đang tải", back: "Quay lại", close: "Đóng", reset: "Đặt lại", filter: "Lọc", create: "Tạo", createDeck: "Tạo bộ thẻ", decks: "Bộ thẻ", trials: "Thử thách", themes: "Giao diện", settings: "Cài đặt", signOut: "Đăng xuất", noMatches: "Không có kết quả", account: "Tài khoản", gameplay: "Lối chơi", audio: "Âm thanh", comfort: "Thoải mái", privacy: "Quyền riêng tư" }),
    id: createCoreDictionary({ save: "Simpan", cancel: "Batal", delete: "Hapus", edit: "Edit", play: "Main", loading: "Memuat", back: "Kembali", close: "Tutup", reset: "Reset", filter: "Filter", create: "Buat", createDeck: "Buat deck", decks: "Deck", trials: "Uji coba", themes: "Tema", settings: "Pengaturan", signOut: "Keluar", noMatches: "Tidak ada hasil", account: "Akun", gameplay: "Gameplay", audio: "Audio", comfort: "Kenyamanan", privacy: "Privasi" }),
    ms: createCoreDictionary({ save: "Simpan", cancel: "Batal", delete: "Padam", edit: "Edit", play: "Main", loading: "Memuat", back: "Kembali", close: "Tutup", reset: "Tetap semula", filter: "Tapis", create: "Cipta", createDeck: "Cipta deck", decks: "Deck", trials: "Cabaran", themes: "Tema", settings: "Tetapan", signOut: "Log keluar", noMatches: "Tiada hasil", account: "Akaun", gameplay: "Gameplay", audio: "Audio", comfort: "Keselesaan", privacy: "Privasi" }),
    ro: createCoreDictionary({ save: "Salvează", cancel: "Anulează", delete: "Șterge", edit: "Editează", play: "Joacă", loading: "Se încarcă", back: "Înapoi", close: "Închide", reset: "Resetează", filter: "Filtru", create: "Creează", createDeck: "Creează deck", decks: "Deck-uri", trials: "Probe", themes: "Teme", settings: "Setări", signOut: "Deconectare", noMatches: "Niciun rezultat", account: "Cont", gameplay: "Joc", audio: "Audio", comfort: "Confort", privacy: "Confidențialitate" }),
    hu: createCoreDictionary({ save: "Mentés", cancel: "Mégse", delete: "Törlés", edit: "Szerkesztés", play: "Játék", loading: "Betöltés", back: "Vissza", close: "Bezárás", reset: "Visszaállítás", filter: "Szűrő", create: "Létrehozás", createDeck: "Deck létrehozása", decks: "Deckek", trials: "Próbák", themes: "Témák", settings: "Beállítások", signOut: "Kijelentkezés", noMatches: "Nincs találat", account: "Fiók", gameplay: "Játékmenet", audio: "Hang", comfort: "Kényelem", privacy: "Adatvédelem" }),
    sw: createCoreDictionary({ save: "Hifadhi", cancel: "Ghairi", delete: "Futa", edit: "Hariri", play: "Cheza", loading: "Inapakia", back: "Rudi", close: "Funga", reset: "Weka upya", filter: "Chuja", create: "Unda", createDeck: "Unda deck", decks: "Deck", trials: "Majaribio", themes: "Mandhari", settings: "Mipangilio", signOut: "Ondoka", noMatches: "Hakuna matokeo", account: "Akaunti", gameplay: "Mchezo", audio: "Sauti", comfort: "Faraja", privacy: "Faragha" }),
    fa: createCoreDictionary({ save: "ذخیره", cancel: "لغو", delete: "حذف", edit: "ویرایش", play: "بازی", loading: "در حال بارگذاری", back: "بازگشت", close: "بستن", reset: "بازنشانی", filter: "فیلتر", create: "ایجاد", createDeck: "ایجاد دسته", decks: "دسته‌ها", trials: "چالش‌ها", themes: "تم‌ها", settings: "تنظیمات", signOut: "خروج", noMatches: "نتیجه‌ای نیست", account: "حساب", gameplay: "گیم‌پلی", audio: "صدا", comfort: "راحتی", privacy: "حریم خصوصی" }),
    ur: createCoreDictionary({ save: "محفوظ کریں", cancel: "منسوخ", delete: "حذف", edit: "ترمیم", play: "کھیلیں", loading: "لوڈ ہو رہا ہے", back: "واپس", close: "بند", reset: "ری سیٹ", filter: "فلٹر", create: "بنائیں", createDeck: "ڈیک بنائیں", decks: "ڈیکس", trials: "آزمائشیں", themes: "تھیمز", settings: "ترتیبات", signOut: "سائن آؤٹ", noMatches: "کوئی نتیجہ نہیں", account: "اکاؤنٹ", gameplay: "گیم پلے", audio: "آڈیو", comfort: "آرام", privacy: "رازداری" })
} satisfies Record<string, Dictionary>