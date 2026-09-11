'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/src/lib/supabase'
import { toPng } from 'html-to-image'

const ADMIN_EMAIL = 'toarudanaei@gmail.com'
const FEEDBACK_FORM_URL = 'https://forms.gle/PMcvrA76MdTQWnpa6'

const STATUS_COLORS: { [key: string]: { label: string; color: string; bgClass: string } } = {
  interested: { label: '興味あり', color: '#3b82f6', bgClass: 'bg-blue-500 hover:bg-blue-600' },
  favorite_play: { label: '好きなプレイ', color: '#eab308', bgClass: 'bg-yellow-500 hover:bg-yellow-600' },
  experienced: { label: '経験あり', color: '#22c55e', bgClass: 'bg-green-500 hover:bg-green-600' },
  favorite: { label: '大好物', color: '#ec4899', bgClass: 'bg-pink-500 hover:bg-pink-600' },
  owned: { label: '所持', color: '#8b5cf6', bgClass: 'bg-purple-500 hover:bg-purple-600' },
}

const TOPIC_CATEGORIES = [
  { id: 'training', label: '調教' },
  { id: 'exposure', label: '露出' },
  { id: 'bondage', label: '拘束・束縛' },
  { id: 'shame', label: '羞恥・罰' },
  { id: 'endurance', label: '放置・耐性' },
  { id: 'service', label: 'ご奉仕・命令' },
  { id: 'toys', label: '道具・玩具' },
]

const INITIAL_CATEGORIES = [
  { id: 'cat_body', title: '身体・部位', category_level: 1, parent_id: null, sort_order: 1 },
  { id: 'sub_body_upper', title: '上半身・顔・首', category_level: 2, parent_id: 'cat_body', sort_order: 2 },
  { id: 'item_face', title: '顔・表情', category_level: 3, parent_id: 'sub_body_upper', sort_order: 3 },
  { id: 'item_eyes', title: '目・視線', category_level: 3, parent_id: 'sub_body_upper', sort_order: 4 },
  { id: 'item_mouth', title: '口・唇・舌', category_level: 3, parent_id: 'sub_body_upper', sort_order: 5 },
  { id: 'item_neck', title: '首・うなじ', category_level: 3, parent_id: 'sub_body_upper', sort_order: 6 },
  { id: 'item_breast', title: '胸・乳首', category_level: 3, parent_id: 'sub_body_upper', sort_order: 7 },
  
  { id: 'cat_action', title: '行動・プレイ', category_level: 1, parent_id: null, sort_order: 10 },
  { id: 'sub_act_basic', title: '基本プレイ', category_level: 2, parent_id: 'cat_action', sort_order: 11 },
  { id: 'item_kiss', title: 'キス・愛撫', category_level: 3, parent_id: 'sub_act_basic', sort_order: 12 },
  { id: 'item_oral', title: 'フェラチオ・クンニ', category_level: 3, parent_id: 'sub_act_basic', sort_order: 13 },

  { id: 'cat_tools', title: '道具・オモチャ・アイテム', category_level: 1, parent_id: null, sort_order: 100 },
  { id: 'sub_tool_insertion', title: '挿入系玩具', category_level: 2, parent_id: 'cat_tools', sort_order: 101 },
  { id: 'item_t_vib_1', title: 'バイブ類', category_level: 3, parent_id: 'sub_tool_insertion', sort_order: 102 },
  { id: 'item_t_vib_2', title: 'ローター（小型振動）', category_level: 3, parent_id: 'sub_tool_insertion', sort_order: 103 },
]

const CUSTOM_FIELD_CONFIGS = [
  { id: 'field_1', label: 'カスタム項目 1（テキスト）', type: 'text' },
  { id: 'field_birthdate', label: '生年月日', type: 'date' },
  { id: 'field_sns', label: 'SNSアカウント', type: 'text', placeholder: '@username または URL' },
  { id: 'field_email', label: 'メールアドレス', type: 'email', placeholder: 'example@domain.com' },
  { id: 'field_tel', label: '電話番号', type: 'tel', placeholder: '090-0000-0000' },
  { id: 'field_address', label: '住所（自由入力）', type: 'textarea', placeholder: '任意の住所や架空の住所を入力できます' },

  { id: 'male_chin_length', label: 'チン長', type: 'text', placeholder: '例: 15cm', condition: { field: 'field_gender', value: '男性' } },
  { id: 'male_chin_girth', label: 'チン太', type: 'text', placeholder: '例: 12cm', condition: { field: 'field_gender', value: '男性' } },
  { id: 'male_height', label: '身長', type: 'text', placeholder: '例: 175cm', condition: { field: 'field_gender', value: '男性' } },
  { id: 'male_weight', label: '体重', type: 'text', placeholder: '例: 65kg', condition: { field: 'field_gender', value: '男性' } },

  { id: 'female_cup', label: 'カップ数', type: 'select', options: ['Aカップ', 'Bカップ', 'Cカップ', 'Dカップ', 'Eカップ', 'Fカップ以上'], condition: { field: 'field_gender', value: '女性' } },
  { id: 'female_bust', label: 'バスト', type: 'text', placeholder: '例: 85cm', condition: { field: 'field_gender', value: '女性' } },
  { id: 'female_waist', label: 'ウエスト', type: 'text', placeholder: '例: 58cm', condition: { field: 'field_gender', value: '女性' } },
  { id: 'female_hip', label: 'ヒップ', type: 'text', placeholder: '例: 88cm', condition: { field: 'field_gender', value: '女性' } },
  { id: 'female_height', label: '身長', type: 'text', placeholder: '例: 160cm', condition: { field: 'field_gender', value: '女性' } },
  { id: 'female_weight', label: '体重', type: 'text', placeholder: '例: 48kg', condition: { field: 'field_gender', value: '女性' } },

  { id: 'm_experience', label: 'M歴（マゾ歴）', type: 'text', placeholder: '例: 3年' },
  { id: 'm_favorite_play', label: '好きなMプレイ・シチュエーション', type: 'textarea', placeholder: '拘束、放置、羞恥プレイなど...' },

  { id: 'text_2', label: 'ご主人様・女王様へのメッセージ', type: 'textarea', placeholder: '自由記述...' },
  { id: 'text_3', label: '自分のMとしての弱点・敏感な部分', type: 'textarea', placeholder: '自由記述...' },

  { id: 'select_1', label: '主従関係の好み', type: 'select', options: ['絶対服従', '合意の上での主従'] },
  { id: 'select_2', label: '人前での羞恥プレイの度合い', type: 'select', options: ['完全シークレット', 'ネットや写真なら可', 'リアルでもさらされたい'] },

  { id: 'img_1', label: '全身(服あり・正面)', type: 'image', multiple: true },
  { id: 'img_2', label: '全身(服あり・背面)', type: 'image', multiple: true },
  { id: 'img_3', label: '全身(全裸・正面)', type: 'image', multiple: true },
  { id: 'img_4', label: '全身(全裸・背面)', type: 'image', multiple: true },
  { id: 'img_5', label: '使用しているお気に入り具材・アイテム', type: 'image', multiple: true },
  { id: 'img_6', label: '恥ずかしいポーズや体勢', type: 'image', multiple: true },
  { id: 'img_7', label: 'その他アピール用メディア', type: 'image', multiple: true },
]

const normalizeText = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60))
}

const renderHearts = (difficulty: number) => {
  const count = Math.max(1, Math.min(5, difficulty || 1))
  return '♥'.repeat(count) + '♡'.repeat(5 - count)
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'list' | 'settings' | 'admin'>('main')
  const [showTutorialModal, setShowTutorialModal] = useState(false)

  const [profile, setProfile] = useState({
    username: '',
    avatar_url: '',
    bio: '',
    send_mode: 'fake',
  })

  const [customValues, setCustomValues] = useState<{ [key: string]: any }>({})
  const [customsGlobalEnabled, setCustomsGlobalEnabled] = useState(false)
  
  const [masochistInputPw, setMasochistInputPw] = useState('')
  const [masochistAgreed, setMasochistAgreed] = useState(false)
  const [masochistUnlocked, setMasochistUnlocked] = useState(false)
  const [masochistAuthError, setMasochistAuthError] = useState(false)
  
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const contractBoxRef = useRef<HTMLDivElement | null>(null)

  const [sendToggles, setSendToggles] = useState<{ [key: string]: boolean }>({
    base_profile: true,
    topic_answer: true,
    customs_all: true,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [customImageFiles, setCustomImageFiles] = useState<{ [key: string]: File[] }>({})
  const [customImagePreviews, setCustomImagePreviews] = useState<{ [key: string]: string[] }>({})
  const [savingProfile, setSavingProfile] = useState(false)

  const defaultNormalPrompt = {
    id: 'default_001',
    title: '【調教課題001】',
    description: `外出時の服装を決定せよ。`,
    difficulty: 3,
    extra_feature: 'サイコロ',
    feature_config: [
      '6',
      '1〜2：ノーパン',
      '3〜4：ノーブラ',
      '5〜6：ノーパンノーブラ'
    ],
    categories: ['training', 'exposure'],
    topic_date: new Date().toISOString(),
    status: 'published',
    target_type: 'normal'
  }

  const defaultMasochistPrompt = {
    id: 'default_m_001',
    title: '【マゾ専用課題001】',
    description: `🖤奴隷用ミッション🖤\nお仕置き内容を決定する。`,
    difficulty: 5,
    extra_feature: 'ペナルティランダム罰',
    feature_config: [
      'ロープ拘束10分追加',
      '洗濯バサミ責め',
      '四つんばい放置',
      '追加お説教'
    ],
    categories: ['training', 'bondage'],
    topic_date: new Date().toISOString(),
    status: 'published',
    target_type: 'masochist'
  }

  const [prompt, setPrompt] = useState<any>(defaultNormalPrompt)
  const [masochistPrompt, setMasochistPrompt] = useState<any>(defaultMasochistPrompt)
  
  const [pastPrompts, setPastPrompts] = useState<any[]>([])
  const [pastMasochistPrompts, setPastMasochistPrompts] = useState<any[]>([])
  const [stockPrompts, setStockPrompts] = useState<any[]>([])
  const [selectedPromptTab, setSelectedPromptTab] = useState<'normal' | 'masochist' | 'stock' | 'archive'>('normal')

  const [adminFormNormal, setAdminFormNormal] = useState({
    title: '',
    description: '',
    difficulty: 3,
    extra_feature: 'サイコロ',
    dice_max: 6,
    feature_config_text: '1〜2：ノーパン\n3〜4：ノーブラ\n5〜6：ノーパンノーブラ',
    categories: [] as string[],
    topic_date: new Date().toISOString().split('T')[0],
    status: 'published'
  })

  const [adminFormMasochist, setAdminFormMasochist] = useState({
    title: '',
    description: '',
    difficulty: 4,
    extra_feature: 'ペナルティランダム罰',
    dice_max: 6,
    feature_config_text: 'ロープ拘束10分追加\n洗濯バサミ責め\n四つんばい放置\n追加お説教',
    categories: [] as string[],
    topic_date: new Date().toISOString().split('T')[0],
    status: 'published'
  })

  const [adminSlotWhen, setAdminSlotWhen] = useState('今すぐ\n深夜\n休日')
  const [adminSlotWhere, setAdminSlotWhere] = useState('自宅\n個室\n屋外')
  const [adminSlotWhoEnabled, setAdminSlotWhoEnabled] = useState(true)
  const [adminSlotWho, setAdminSlotWho] = useState('ご主人様\nパートナー\n1人で')
  const [adminSlotWhat, setAdminSlotWhat] = useState('拘束\n放置\n露出')

  const [featureResult, setFeatureResult] = useState<string | null>(null)
  const [slotResults, setSlotResults] = useState<{ when: string; where: string; who: string; what: string } | null>(null)

  const [timerSeconds, setTimerSeconds] = useState<number>(300)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  useEffect(() => {
    let interval: any = null
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timerSeconds])

  const [sheetCsvInput, setSheetCsvInput] = useState('')

  const [answers, setAnswers] = useState<any[]>([])
  const [newAnswer, setNewAnswer] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [postPreview, setPostPreview] = useState<string | null>(null)

  const [showSendModal, setShowSendModal] = useState(false)
  
  type MediaItem = {
    id: string
    file: File
    preview: string
    comment: string
    selectedItemIds: { [itemId: string]: boolean }
  }
  const [modalMediaItems, setModalMediaItems] = useState<MediaItem[]>([])
  const [modalCategorySearch, setModalCategorySearch] = useState('')
  const [modalOpenCategories, setModalOpenCategories] = useState<{ [key: string]: boolean }>({})
  const [activeMediaIdForCheck, setActiveMediaIdForCheck] = useState<string | null>(null)

  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [selectedMediaDetail, setSelectedMediaDetail] = useState<{ recordId: string; itemId: string; url: string; type: string; comment?: string } | null>(null)

  const [categories, setCategories] = useState<any[]>(INITIAL_CATEGORIES)
  const [itemsMap, setItemsMap] = useState<{ [key: string]: string }>({})
  const [checks, setChecks] = useState<{ [key: string]: string[] }>({})
  const [manualIndependentChecks, setManualIndependentChecks] = useState<{ [key: string]: boolean }>({})
  
  type ItemMediaRecord = { id: string; media_url: string; media_type: string; comment?: string }
  const [itemMediaMap, setItemMediaMap] = useState<{ [key: string]: ItemMediaRecord[] }>({})
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)

  const [savingId, setSavingId] = useState<string | null>(null)
  
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({})
  const [openSubCategories, setOpenSubCategories] = useState<{ [key: string]: boolean }>({})

  const [allSendHistory, setAllSendHistory] = useState<any[]>([])
  const [listSearchQuery, setListSearchQuery] = useState('')
  const [categoryPages, setCategoryPages] = useState<{ [key: string]: number }>({})

  const [selectedHistoryDriveData, setSelectedHistoryDriveData] = useState<any | null>(null)

  const touchStartRef = useRef<{ [key: string]: number }>({})
  const [exportingKey, setExportingKey] = useState<string | null>(null)
  const [sendingToAdmin, setSendingToAdmin] = useState(false)
  const sheetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const isAdmin = user?.email === ADMIN_EMAIL

  const loadUserData = async (userId: string) => {
    await fetchProfile(userId)
    await fetchUserChecks(userId)
    await fetchAnswers(userId)
    await fetchItemMedia(userId)
  }

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadUserData(currentUser.id)
      } else {
        setChecks({})
        setManualIndependentChecks({})
        setItemMediaMap({})
        setProfile({ username: '', avatar_url: '', bio: '', send_mode: 'fake' })
        setCustomValues({})
        setCustomsGlobalEnabled(false)
      }
    }
    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadUserData(currentUser.id)
      } else {
        setChecks({})
        setManualIndependentChecks({})
        setItemMediaMap({})
        setProfile({ username: '', avatar_url: '', bio: '', send_mode: 'fake' })
        setCustomValues({})
        setCustomsGlobalEnabled(false)
        setAnswers([])
      }
    })

    fetchData()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    const { data: topicsData } = await supabase
      .from('daily_topics')
      .select('*')
      .order('topic_date', { ascending: false })

    if (topicsData && topicsData.length > 0) {
      const now = new Date()
      const manualStock = topicsData.filter((t: any) => t.status === 'stock')

      const autoArchivedStock = topicsData.filter((t: any) => {
        if (t.status !== 'published') return false
        const topicDate = new Date(t.topic_date)
        const diffTime = now.getTime() - topicDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 1 && diffDays <= 30
      })

      const publishedTopics = topicsData.filter((t: any) => t.status === 'published')
      const normals = publishedTopics.length > 0 
        ? publishedTopics.filter((t: any) => t.target_type !== 'masochist')
        : topicsData.filter((t: any) => t.target_type !== 'masochist')

      const masochists = publishedTopics.length > 0
        ? publishedTopics.filter((t: any) => t.target_type === 'masochist')
        : topicsData.filter((t: any) => t.target_type === 'masochist')

      if (normals.length > 0) {
        setPrompt(normals[0])
        setPastPrompts(normals.slice(1))
      } else {
        setPrompt(defaultNormalPrompt)
      }

      if (masochists.length > 0) {
        setMasochistPrompt(masochists[0])
        setPastMasochistPrompts(masochists.slice(1))
      } else {
        setMasochistPrompt(defaultMasochistPrompt)
      }

      setStockPrompts([...manualStock, ...autoArchivedStock])
    } else {
      setPrompt(defaultNormalPrompt)
      setMasochistPrompt(defaultMasochistPrompt)
    }

    await fetchCategories()
  }

  const handleCreateTopicAdmin = async (targetType: 'normal' | 'masochist') => {
    const formData = targetType === 'normal' ? adminFormNormal : adminFormMasochist
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('タイトルと文章を入力してください')
      return
    }

    let configPayload: string[] = []
    if (formData.extra_feature === 'サイコロ') {
      const lines = formData.feature_config_text.split('\n').map(s => s.trim()).filter(Boolean)
      configPayload = [String(formData.dice_max), ...lines]
    } else if (formData.extra_feature === 'スロットマシン') {
      const whenLines = adminSlotWhen.split('\n').map(s => s.trim()).filter(Boolean)
      const whereLines = adminSlotWhere.split('\n').map(s => s.trim()).filter(Boolean)
      const whoLines = adminSlotWhoEnabled ? adminSlotWho.split('\n').map(s => s.trim()).filter(Boolean) : []
      const whatLines = adminSlotWhat.split('\n').map(s => s.trim()).filter(Boolean)

      configPayload = [
        `WHEN:${whenLines.join(';')}`,
        `WHERE:${whereLines.join(';')}`,
        `WHO_ENABLED:${adminSlotWhoEnabled ? '1' : '0'}`,
        `WHO:${whoLines.join(';')}`,
        `WHAT:${whatLines.join(';')}`
      ]
    } else {
      configPayload = formData.feature_config_text.split('\n').map(s => s.trim()).filter(Boolean)
    }

    try {
      const { error } = await supabase.from('daily_topics').insert({
        title: formData.title,
        description: formData.description,
        difficulty: Number(formData.difficulty) || 3,
        extra_feature: formData.extra_feature,
        feature_config: configPayload,
        categories: formData.categories,
        topic_date: new Date(formData.topic_date || Date.now()).toISOString(),
        status: formData.status,
        target_type: targetType
      })

      if (error) throw error
      alert(`${targetType === 'masochist' ? 'マゾ向け' : '一般向け'}お題を登録しました！`)
      await fetchData()
    } catch (err: any) {
      alert(`登録に失敗しました: ${err.message || err}`)
    }
  }

  const handleImportSpreadsheetCsv = async (csvText?: string) => {
    const targetText = csvText !== undefined ? csvText : sheetCsvInput
    if (!targetText.trim()) return
    try {
      const lines = targetText.trim().split('\n')
      for (const line of lines) {
        if (!line.trim() || line.startsWith('タイトル') || line.startsWith('【')) continue
        const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',')
        if (parts.length >= 2) {
          const title = parts[0]?.trim() || '【調教課題】'
          const description = parts[1]?.trim().replace(/\\n/g, '\n').replace(/^["']|["']$/g, '') || ''
          const topic_date = parts[2]?.trim() || new Date().toISOString()
          const status = parts[3]?.trim() || 'published'
          const target_type = parts[4]?.trim() || 'normal'
          const difficulty = Number(parts[5]) || 3
          const extra_feature = parts[6]?.trim() || 'なし'
          const configLines = parts[7] ? parts[7].split(';').map(s => s.trim()) : []
          const categories = parts[8] ? parts[8].split(';').map(s => s.trim()) : ['training']

          await supabase.from('daily_topics').insert({
            title,
            description,
            topic_date,
            status,
            target_type,
            difficulty,
            extra_feature,
            feature_config: configLines,
            categories
          })
        }
      }
      alert('スプレッドシートのデータを同期・インポートしました！')
      setSheetCsvInput('')
      await fetchData()
    } catch (err: any) {
      alert(`インポートに失敗しました: ${err.message || err}`)
    }
  }

  const handleFileUploadForSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      if (content) {
        setSheetCsvInput(content)
        await handleImportSpreadsheetCsv(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const fetchCategories = async () => {
    const { data: kinkData } = await supabase
      .from('kinky_items')
      .select('*')
      .order('sort_order', { ascending: true })

    const finalKinkData = (kinkData && kinkData.length > 5) ? kinkData : INITIAL_CATEGORIES

    setCategories(finalKinkData)
    const map: { [key: string]: string } = {}
    finalKinkData.forEach((item) => {
      map[item.id] = item.title
    })
    setItemsMap(map)

    setOpenCategories((prev) => {
      const initialOpenState: { [key: string]: boolean } = { ...prev }
      finalKinkData.forEach((item) => {
        if (item.category_level === 1 && initialOpenState[item.id] === undefined) {
          initialOpenState[item.id] = true
        }
      })
      return initialOpenState
    })
    setOpenSubCategories((prev) => {
      const initialSubState: { [key: string]: boolean } = { ...prev }
      finalKinkData.forEach((item) => {
        if (item.category_level === 2 && initialSubState[item.id] === undefined) {
          initialSubState[item.id] = true
        }
      })
      return initialSubState
    })
    setModalOpenCategories((prev) => {
      const initialModalState: { [key: string]: boolean } = { ...prev }
      finalKinkData.forEach((item) => {
        if (item.category_level === 1 && initialModalState[item.id] === undefined) {
          initialModalState[item.id] = false
        }
      })
      return initialModalState
    })
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      setProfile({
        username: data.username || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        send_mode: data.send_mode || 'fake',
      })
      if (!data.has_seen_tutorial) {
        setShowTutorialModal(true)
      }
      if (data.custom_fields && typeof data.custom_fields === 'object') {
        const values = data.custom_fields.values || {}
        setCustomValues(values)
        setCustomsGlobalEnabled(!!data.custom_fields.globalEnabled)
        if (data.custom_fields.globalEnabled) {
          setMasochistUnlocked(true)
          setMasochistAgreed(true)
        }
        const previews: { [key: string]: string[] } = {}
        Object.entries(values).forEach(([k, v]) => {
          if (k.startsWith('img_')) {
            if (Array.isArray(v)) {
              previews[k] = v
            } else if (typeof v === 'string' && v.trim()) {
              previews[k] = [v]
            }
          }
        })
        setCustomImagePreviews(previews)
      }
    } else {
      setProfile({ username: '', avatar_url: '', bio: '', send_mode: 'fake' })
      setCustomValues({})
      setCustomsGlobalEnabled(false)
      setCustomImagePreviews({})
      setShowTutorialModal(true)
    }
  }

  const handleCompleteTutorial = async () => {
    if (!user) return
    setShowTutorialModal(false)
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        has_seen_tutorial: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
  }

  const fetchAnswers = async (userId: string) => {
    const { data } = await supabase
      .from('topic_answers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) setAnswers(data)
  }

  const fetchUserChecks = async (userId: string) => {
    const { data } = await supabase
      .from('user_checks')
      .select('item_id, status')
      .eq('user_id', userId)

    const checkMap: { [key: string]: string[] } = {}
    if (data) {
      data.forEach((item) => {
        if (!checkMap[item.item_id]) checkMap[item.item_id] = []
        checkMap[item.item_id].push(item.status)
      })
    }
    setChecks(checkMap)
  }

  const fetchItemMedia = async (userId: string) => {
    const { data } = await supabase
      .from('user_item_media')
      .select('id, item_id, media_url, media_type, comment')
      .eq('user_id', userId)

    const mediaMap: { [key: string]: ItemMediaRecord[] } = {}
    if (data) {
      data.forEach((row) => {
        if (!mediaMap[row.item_id]) mediaMap[row.item_id] = []
        mediaMap[row.item_id].push(row)
      })
    }
    setItemMediaMap(mediaMap)
  }

  const handleItemMediaUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setUploadingItemId(itemId)
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const filePath = `item_media/${user.id}_${itemId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
        const mediaUrl = publicUrlData.publicUrl
        const mediaType = file.type.startsWith('video') ? 'video' : 'image'

        const { data: insertedData, error: insertError } = await supabase.from('user_item_media').insert({
          user_id: user.id,
          item_id: itemId,
          media_url: mediaUrl,
          media_type: mediaType,
          comment: '',
        }).select().single()

        if (insertError) throw insertError

        if (insertedData) {
          setItemMediaMap((prev) => ({
            ...prev,
            [itemId]: [...(prev[itemId] || []), insertedData],
          }))

          setSelectedMediaDetail({
            recordId: insertedData.id,
            itemId: itemId,
            url: mediaUrl,
            type: mediaType,
            comment: '',
          })
        }
      }
    } catch (err: any) {
      console.error('メディアアップロードエラー:', err)
      alert(`アップロードに失敗しました: ${err.message || err}`)
    } finally {
      setUploadingItemId(null)
      e.target.value = ''
    }
  }

  const handleUpdateMediaComment = async (recordId: string, itemId: string, comment: string) => {
    setItemMediaMap((prev) => {
      const list = prev[itemId] || []
      return {
        ...prev,
        [itemId]: list.map((m) => (m.id === recordId ? { ...m, comment } : m)),
      }
    })

    if (selectedMediaDetail && selectedMediaDetail.recordId === recordId) {
      setSelectedMediaDetail((prev) => prev ? { ...prev, comment } : null)
    }

    await supabase
      .from('user_item_media')
      .update({ comment })
      .eq('id', recordId)
  }

  const handleItemMediaDelete = async (recordId: string, itemId: string) => {
    if (!user || !confirm('本当にこの写真・動画を削除しますか？')) return

    try {
      await supabase
        .from('user_item_media')
        .delete()
        .eq('id', recordId)

      setItemMediaMap((prev) => {
        const currentList = prev[itemId] || []
        return {
          ...prev,
          [itemId]: currentList.filter((m) => m.id !== recordId),
        }
      })
      if (selectedMediaDetail?.recordId === recordId) {
        setSelectedMediaDetail(null)
      }
    } catch (err: any) {
      console.error('メディア削除エラー:', err)
    }
  }

  const fetchAllSendHistory = async () => {
    if (!isAdmin) return

    const { data: profilesData } = await supabase.from('user_profiles').select('*')
    const profileMap: { [key: string]: any } = {}
    profilesData?.forEach((p) => {
      profileMap[p.user_id] = p
    })

    const { data: checksData } = await supabase.from('user_checks').select('user_id, item_id, status')
    const checksMap: { [key: string]: { [itemId: string]: string[] } } = {}
    checksData?.forEach((c) => {
      if (!checksMap[c.user_id]) checksMap[c.user_id] = {}
      if (!checksMap[c.user_id][c.item_id]) checksMap[c.user_id][c.item_id] = []
      checksMap[c.user_id][c.item_id].push(c.status)
    })

    const { data: mediaData } = await supabase.from('user_item_media').select('*')
    const mediaMap: { [key: string]: any[] } = {}
    mediaData?.forEach((m) => {
      if (!mediaMap[m.user_id]) mediaMap[m.user_id] = []
      mediaMap[m.user_id].push(m)
    })

    const { data: answersData } = await supabase.from('topic_answers').select('*').order('created_at', { ascending: false })

    const historyList: any[] = []
    
    if (answersData && answersData.length > 0) {
      answersData.forEach((answer) => {
        const uid = answer.user_id
        const userProfile = profileMap[uid] || { username: answer.user_name || '名無しさん', bio: '', custom_fields: {} }
        const userChecks = checksMap[uid] || {}
        const userMedia = mediaMap[uid] || []

        const completeKinksStructure = categories.map((cat) => {
          if (cat.category_level === 3) {
            const statuses = userChecks[cat.id] || []
            const itemMedias = userMedia.filter((m) => m.item_id === cat.id)
            return {
              item_id: cat.id,
              title: cat.title,
              statuses: statuses,
              media_files: itemMedias.map((im) => ({
                url: im.media_url,
                type: im.media_type,
                comment: im.comment,
              })),
            }
          }
          return null
        }).filter(Boolean)

        historyList.push({
          history_id: answer.id,
          sent_at: answer.created_at,
          user_id: uid,
          profile: {
            username: userProfile.username,
            bio: userProfile.bio,
            custom_fields: userProfile.custom_fields || {},
          },
          all_kinks: completeKinksStructure,
          topic_answer: answer,
          associated_media_list: userMedia,
        })
      })
    } else {
      profilesData?.forEach((p) => {
        const uid = p.user_id
        const userChecks = checksMap[uid] || {}
        const userMedia = mediaMap[uid] || []
        const completeKinksStructure = categories.map((cat) => {
          if (cat.category_level === 3) {
            const statuses = userChecks[cat.id] || []
            const itemMedias = userMedia.filter((m) => m.item_id === cat.id)
            return {
              item_id: cat.id,
              title: cat.title,
              statuses: statuses,
              media_files: itemMedias.map((im) => ({
                url: im.media_url,
                type: im.media_type,
                comment: im.comment,
              })),
            }
          }
          return null
        }).filter(Boolean)

        historyList.push({
          history_id: `profile_${uid}`,
          sent_at: p.updated_at || new Date().toISOString(),
          user_id: uid,
          profile: {
            username: p.username,
            bio: p.bio,
            custom_fields: p.custom_fields || {},
          },
          all_kinks: completeKinksStructure,
          topic_answer: null,
          associated_media_list: userMedia,
        })
      })
    }

    setAllSendHistory(historyList)
  }

  const handleDeleteHistoryItem = async (historyItem: any) => {
    if (!isAdmin || !confirm('この送信履歴を本当に削除しますか？')) return

    try {
      if (historyItem.topic_answer && historyItem.topic_answer.id) {
        const { error } = await supabase
          .from('topic_answers')
          .delete()
          .eq('id', historyItem.topic_answer.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', historyItem.user_id)

        if (error) throw error
      }

      await fetchAllSendHistory()
      alert('送信履歴を削除しました。')
    } catch (err: any) {
      console.error('削除エラー:', err)
      alert(`削除に失敗しました: ${err.message || err}`)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) setAvatarPreview(URL.createObjectURL(file))
    else setAvatarPreview(null)
  }

  const handleCustomImagesChange = async (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    const newFilesList = Array.from(files)
    setCustomImageFiles((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newFilesList],
    }))

    const newPreviewUrls = newFilesList.map((f) => URL.createObjectURL(f))
    setCustomImagePreviews((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPreviewUrls],
    }))

    const uploadedUrls: string[] = [...(Array.isArray(customValues[fieldId]) ? customValues[fieldId] : (customValues[fieldId] ? [customValues[fieldId]] : []))]
    for (const file of newFilesList) {
      const fileExt = file.name.split('.').pop()
      const filePath = `customs/${user.id}_${fieldId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
        uploadedUrls.push(publicUrlData.publicUrl)
      }
    }
    setCustomValues((prev) => ({ ...prev, [fieldId]: uploadedUrls }))
  }

  const handleRemoveCustomImage = (fieldId: string, index: number) => {
    setCustomImagePreviews((prev) => {
      const list = [...(prev[fieldId] || [])]
      list.splice(index, 1)
      return { ...prev, [fieldId]: list }
    })
    setCustomValues((prev) => {
      const currentVal = prev[fieldId]
      if (Array.isArray(currentVal)) {
        const list = [...currentVal]
        list.splice(index, 1)
        return { ...prev, [fieldId]: list }
      }
      return { ...prev, [fieldId]: [] }
    })
  }

  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    if (file) setPostPreview(URL.createObjectURL(file))
    else setPostPreview(null)
  }

  const handleMultipleModalMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newItems: MediaItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
      comment: '',
      selectedItemIds: {},
    }))

    setModalMediaItems((prev) => {
      const updated = [...prev, ...newItems]
      if (!activeMediaIdForCheck && updated.length > 0) {
        setActiveMediaIdForCheck(updated[0].id)
      }
      return updated
    })
    e.target.value = ''
  }

  const removeModalMediaItem = (id: string) => {
    setModalMediaItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id)
      if (activeMediaIdForCheck === id) {
        setActiveMediaIdForCheck(filtered.length > 0 ? filtered[0].id : null)
      }
      return filtered
    })
  }

  const updateModalMediaComment = (id: string, comment: string) => {
    setModalMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    )
  }

  const toggleMediaItemCheck = (mediaId: string, itemId: string) => {
    setModalMediaItems((prev) =>
      prev.map((item) => {
        if (item.id === mediaId) {
          const currentChecks = { ...item.selectedItemIds }
          if (currentChecks[itemId]) {
            delete currentChecks[itemId]
          } else {
            currentChecks[itemId] = true
          }
          return { ...item, selectedItemIds: currentChecks }
        }
        return item
      })
    )
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)

    let finalAvatarUrl = profile.avatar_url

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, avatarFile, { upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
        finalAvatarUrl = publicUrlData.publicUrl
      }
    }

    const newCustomValues = { ...customValues }

    const customFieldsPayload = {
      values: newCustomValues,
      globalEnabled: customsGlobalEnabled,
    }

    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      username: profile.username,
      avatar_url: finalAvatarUrl,
      bio: profile.bio,
      send_mode: profile.send_mode,
      custom_fields: customFieldsPayload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    setSavingProfile(false)
    if (error) {
      console.error('プロフィール保存エラー:', error.message)
      alert(`保存に失敗しました: ${error.message}`)
    } else {
      setProfile((prev) => ({ ...prev, avatar_url: finalAvatarUrl }))
      setCustomValues(newCustomValues)
      setAvatarFile(null)
      setAvatarPreview(null)
      setCustomImageFiles({})
      alert('設定を保存しました')
    }
  }

  const handleCheckToggle = async (itemId: string, status: string) => {
    if (!user) return
    setSavingId(itemId)

    const currentStatuses = checks[itemId] || []
    const exists = currentStatuses.includes(status)

    if (exists) {
      await supabase
        .from('user_checks')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('status', status)

      setChecks((prev) => ({
        ...prev,
        [itemId]: (prev[itemId] || []).filter((s) => s !== status),
      }))
    } else {
      await supabase.from('user_checks').insert({
        user_id: user.id,
        item_id: itemId,
        status: status,
      })

      setChecks((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), status],
      }))
    }

    setSavingId(null)
  }

  const handleManualCheckToggle = (itemId: string) => {
    setManualIndependentChecks((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const toggleSubCategory = (subId: string) => {
    setOpenSubCategories((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }))
  }

  const toggleModalCategory = (categoryId: string) => {
    setModalOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const handleDownloadSheet = async (key: string, categoryTitle: string, pageIndex: number) => {
    const ref = sheetRefs.current[key]
    if (!ref) return
    setExportingKey(key)

    try {
      const dataUrl = await toPng(ref, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 3,
      })
      const link = document.createElement('a')
      link.download = `kink-jar-${categoryTitle.replace(/[\/\\?%*:|"<>]/g, '')}-p${pageIndex + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('シートの画像生成エラー:', err)
    } finally {
      setExportingKey(null)
    }
  }

  const handleOpenSendModal = () => {
    setShowSendModal(true)
  }

  const executeSendToAdmin = async () => {
    if (!user) return
    setSendingToAdmin(true)

    try {
      const displayName = profile.username || user.user_metadata?.full_name || user.email?.split('@')[0] || '名無しさん'

      const activeCurrentPrompt = selectedPromptTab === 'masochist' ? masochistPrompt : prompt

      if (profile.send_mode === 'real') {
        let finalAvatarUrl = profile.avatar_url
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop()
          const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, avatarFile, { upsert: true })
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
            finalAvatarUrl = publicUrlData.publicUrl
          }
        }

        const newCustomValues = { ...customValues }
        const shouldSendCustoms = sendToggles.customs_all && customsGlobalEnabled
        const filteredCustomValues = shouldSendCustoms ? newCustomValues : {}

        const customFieldsPayload = {
          values: filteredCustomValues,
          globalEnabled: shouldSendCustoms,
        }

        const { error: profileError } = await supabase.from('user_profiles').upsert({
          user_id: user.id,
          username: sendToggles.base_profile ? displayName : '',
          avatar_url: sendToggles.base_profile ? finalAvatarUrl : '',
          bio: sendToggles.base_profile ? profile.bio : '',
          send_mode: profile.send_mode,
          custom_fields: customFieldsPayload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (profileError) {
          throw new Error(profileError.message)
        }

        if (activeCurrentPrompt && sendToggles.topic_answer) {
          if (modalMediaItems.length > 0) {
            for (const media of modalMediaItems) {
              const fileExt = media.file.name.split('.').pop()
              const filePath = `${user.id}/prompt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
              const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, media.file, { upsert: true })

              let mediaUrl = ''
              if (!uploadError) {
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
                mediaUrl = publicUrlData.publicUrl
              }

              const linkedItemsSummary = Object.keys(media.selectedItemIds)
                .filter((id) => media.selectedItemIds[id])
                .map((id) => itemsMap[id] || id)
                .join(', ')

              const finalContent = [
                media.comment.trim(),
                linkedItemsSummary ? `関連する性癖: ${linkedItemsSummary}` : '',
              ].filter(Boolean).join('\n')

              await supabase.from('topic_answers').insert({
                topic_id: activeCurrentPrompt.id,
                user_id: user.id,
                user_name: displayName,
                content: finalContent || '（課題・メディア提出）',
                image_url: mediaUrl || null,
              })
            }
          } else if (newAnswer.trim()) {
            await supabase.from('topic_answers').insert({
              topic_id: activeCurrentPrompt.id,
              user_id: user.id,
              user_name: displayName,
              content: newAnswer.trim(),
              image_url: selectedFile ? await (async () => {
                const fileExt = selectedFile.name.split('.').pop()
                const filePath = `${user.id}/prompt_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, selectedFile, { upsert: true })
                if (!uploadError) {
                  const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
                  return publicUrlData.publicUrl
                }
                return null
              })() : null,
            })
          }
        }

        setShowSendModal(false)
        setSendingToAdmin(false)
        alert('課題の証拠写真と回答を正常に一括提出しました！')
        setNewAnswer('')
        setSelectedFile(null)
        setPostPreview(null)
        setModalMediaItems([])
        setActiveMediaIdForCheck(null)
        await fetchAnswers(user.id)
        return
      }

      const randomDelay = Math.floor(Math.random() * 1500) + 1500
      await new Promise((resolve) => setTimeout(resolve, randomDelay))
      
      setShowSendModal(false)
      setSendingToAdmin(false)
      alert('課題を提出しました（送信演出モード）')
      setNewAnswer('')
      setSelectedFile(null)
      setPostPreview(null)
      setModalMediaItems([])
      setActiveMediaIdForCheck(null)
    } catch (err: any) {
      console.error('提出エラー:', err)
      setSendingToAdmin(false)
      alert(`送信中にエラーが発生しました: ${err.message || err}`)
    }
  }

  const handlePrepareHistoryDriveSave = (historyItem: any) => {
    setSelectedHistoryDriveData(historyItem)
  }

  const executeHistoryDriveSave = () => {
    if (!selectedHistoryDriveData) return
    const userNameSanitized = (selectedHistoryDriveData.profile?.username || 'user').replace(/[\/\\?%*:|"<>]/g, '_')
    const timeSanitized = selectedHistoryDriveData.sent_at.replace(/[\/\\?%*:|"<>:]/g, '-')
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedHistoryDriveData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `kink_jar_send_history_${userNameSanitized}_${timeSanitized}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setSelectedHistoryDriveData(null)
    alert(`この送信データの保存が完了しました！`)
  }

  const handleShareX = () => {
    const text = encodeURIComponent('課題達成しました！')
    const url = encodeURIComponent(window.location.origin)
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleLogin = async (provider: 'google' | 'x') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setChecks({})
    setManualIndependentChecks({})
    setItemMediaMap({})
    setProfile({ username: '', avatar_url: '', bio: '', send_mode: 'fake' })
    setCustomValues({})
    setCustomsGlobalEnabled(false)
    setAnswers([])
  }

  const parentCategories = categories.filter((c) => c.category_level === 1)
  const getSubCategories = (parentId: string) => categories.filter((c) => c.category_level === 2 && c.parent_id === parentId)
  const getChildItems = (subId: string) => categories.filter((c) => c.category_level === 3 && c.parent_id === subId)

  const normalizedListQuery = normalizeText(listSearchQuery.trim())
  const normalizedModalQuery = normalizeText(modalCategorySearch.trim())

  const activeMediaItem = modalMediaItems.find((m) => m.id === activeMediaIdForCheck)

  const currentGenderVal = customValues['field_gender']
  let masochistSectionTitle = 'マゾ向け項目'
  if (currentGenderVal === '男性') {
    masochistSectionTitle = 'マゾオス向け項目'
  } else if (currentGenderVal === '女性') {
    masochistSectionTitle = 'マゾメス向け項目'
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const renderExtraFeatureComponent = (currentPrompt: any) => {
    const featureName = currentPrompt?.extra_feature
    const configList = currentPrompt?.feature_config || []

    if (!featureName || featureName === 'なし') return null

    let diceMax = 6
    let ruleItems = configList

    if (featureName === 'サイコロ' && configList.length > 0) {
      const maybeMax = Number(configList[0])
      if (!isNaN(maybeMax) && maybeMax > 0) {
        diceMax = maybeMax
        ruleItems = configList.slice(1)
      }
    }

    let slotConfig = {
      when: ['今すぐ', '深夜', '休日'],
      where: ['自宅', '個室', '屋外'],
      whoEnabled: true,
      who: ['ご主人様', 'パートナー', '1人で'],
      what: ['拘束', '放置', '露出']
    }

    if (featureName === 'スロットマシン' && configList.length > 0) {
      configList.forEach((line: string) => {
        if (line.startsWith('WHEN:')) {
          slotConfig.when = line.replace('WHEN:', '').split(';').filter(Boolean)
        } else if (line.startsWith('WHERE:')) {
          slotConfig.where = line.replace('WHERE:', '').split(';').filter(Boolean)
        } else if (line.startsWith('WHO_ENABLED:')) {
          slotConfig.whoEnabled = line.replace('WHO_ENABLED:', '') === '1'
        } else if (line.startsWith('WHO:')) {
          slotConfig.who = line.replace('WHO:', '').split(';').filter(Boolean)
        } else if (line.startsWith('WHAT:')) {
          slotConfig.what = line.replace('WHAT:', '').split(';').filter(Boolean)
        }
      })
    }

    return (
      <div className="bg-white/90 p-4 rounded-xl border border-indigo-100 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <span>✨</span> インタラクティブ機能: <span className="text-indigo-600">[{featureName} {featureName === 'サイコロ' ? `(1〜${diceMax})` : ''}]</span>
          </p>
          {ruleItems.length > 0 && featureName !== 'タイマー' && featureName !== 'スロットマシン' && (
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ルール定義済み ({ruleItems.length}件)</span>
          )}
        </div>

        {ruleItems.length > 0 && featureName !== 'タイマー' && featureName !== 'スロットマシン' && (
          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
            <p className="font-bold text-[10px] text-indigo-800">📋 候補・分岐ルール一覧:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {ruleItems.map((cfg: string, idx: number) => (
                <li key={idx}>{cfg}</li>
              ))}
            </ul>
          </div>
        )}

        {featureName === 'サイコロ' && (
          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={() => {
                const roll = Math.floor(Math.random() * diceMax) + 1
                let matched = `出目: ${roll}`
                if (ruleItems.length > 0) {
                  const found = ruleItems.find((c: string) => {
                    const cNum = c.split(/[:：]/)[0] || ''
                    return cNum.includes(String(roll))
                  })
                  if (found) {
                    matched = `🎲 出目 ${roll} ➔ ${found}`
                  } else {
                    matched = `🎲 出目 ${roll} （該当ルールなし）`
                  }
                }
                setFeatureResult(matched)
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              🎲 サイコロを振る (1〜{diceMax})
            </button>
            {featureResult && (
              <div className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-2 rounded-lg border border-pink-200 animate-pulse">
                {featureResult}
              </div>
            )}
          </div>
        )}

        {featureName === 'タイマー' && (
          <div className="space-y-2">
            <div className="text-3xl font-mono font-extrabold text-indigo-950 bg-indigo-50/80 p-3 rounded-lg text-center border">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow ${isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {isTimerRunning ? '一時停止' : 'スタート'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false)
                  const initialSecs = configList.length > 0 && !isNaN(Number(configList[0])) ? Number(configList[0]) : 300
                  setTimerSeconds(initialSecs)
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg"
              >
                リセット ({configList.length > 0 && !isNaN(Number(configList[0])) ? `${Math.floor(Number(configList[0])/60)}分` : '5分'})
              </button>
            </div>
          </div>
        )}

        {featureName === 'ルーレット' && (
          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={() => {
                const pool = configList.length > 0 ? configList : ['高速ピストン', '放置プレイ10分', '羞恥写メ提出', 'お仕置き追加', 'ご褒美スキンシップ']
                const picked = pool[Math.floor(Math.random() * pool.length)]
                setFeatureResult(`🎡 当選結果 ➔ ${picked}`)
              }}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              🎡 ルーレットを回す
            </button>
            {featureResult && (
              <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 animate-pulse">
                {featureResult}
              </div>
            )}
          </div>
        )}

        {featureName === 'スロットマシン' && (
          <div className="space-y-3 text-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
              <div className="bg-indigo-50/70 p-2 rounded border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-800 block">【いつ】</span>
                <span className="text-xs font-bold text-gray-900">{slotResults ? slotResults.when : '未回転'}</span>
              </div>
              <div className="bg-indigo-50/70 p-2 rounded border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-800 block">【どこで】</span>
                <span className="text-xs font-bold text-gray-900">{slotResults ? slotResults.where : '未回転'}</span>
              </div>
              {slotConfig.whoEnabled && (
                <div className="bg-indigo-50/70 p-2 rounded border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-800 block">【だれと】</span>
                  <span className="text-xs font-bold text-gray-900">{slotResults ? slotResults.who : '未回転'}</span>
                </div>
              )}
              <div className="bg-indigo-50/70 p-2 rounded border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-800 block">【なに】</span>
                <span className="text-xs font-bold text-gray-900">{slotResults ? slotResults.what : '未回転'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const w1 = slotConfig.when[Math.floor(Math.random() * slotConfig.when.length)] || '今すぐ'
                const w2 = slotConfig.where[Math.floor(Math.random() * slotConfig.where.length)] || '自宅'
                const w3 = slotConfig.whoEnabled ? (slotConfig.who[Math.floor(Math.random() * slotConfig.who.length)] || '1人で') : 'なし'
                const w4 = slotConfig.what[Math.floor(Math.random() * slotConfig.what.length)] || '拘束'
                setSlotResults({ when: w1, where: w2, who: w3, what: w4 })
              }}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              🎰 スロットを回す
            </button>
          </div>
        )}

        {featureName === 'ペナルティランダム罰' && (
          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={() => {
                const pool = configList.length > 0 ? configList : ['追加の拘束15分', 'お説教30分', '全裸正座', '恥ずかしい自撮り追加']
                const penalty = pool[Math.floor(Math.random() * pool.length)]
                setFeatureResult(`⚡ 罰ゲーム決定 ➔ ${penalty}`)
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              ⚡ ペナルティをランダム抽選
            </button>
            {featureResult && (
              <div className="text-xs font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-pulse">
                {featureResult}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const FeedbackFooter = () => (
    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
      <div className="bg-gray-50 border rounded-xl p-4 space-y-2 max-w-lg mx-auto shadow-xs">
        <h3 className="text-xs font-bold text-gray-800">💡 バグ報告・機能追加の要望はこちら</h3>
        <p className="text-[11px] text-gray-500">開発者に直接ご意見・ご要望・項目の追加/削除依頼をお送りいただけます。</p>
        <a
          href={FEEDBACK_FORM_URL} 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
        >
          Googleフォームで意見を送る ↗
        </a>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {showTutorialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-indigo-900">✨ 性癖メモへようこそ！</h3>
            <p className="text-xs text-gray-600 leading-relaxed text-left">
              当アプリでは、あなたの性癖をカテゴリごとに細かく記録・管理したり、日々の調教課題に挑戦して証拠を提出することができます。
            </p>
            
            <div className="space-y-2 text-left bg-indigo-50/50 p-3 rounded-lg text-xs">
              <p className="font-bold text-indigo-950">📌 簡単な使い方:</p>
              <p>1. <b>「性癖一覧」タブ</b>から好みの項目にチェックを入れる。</p>
              <p>2. メイン画面の<b>お題・課題</b>に回答や証拠写真を提出する。</p>
              <p>3. 自分のボトルシートを保存してシェアする。</p>
            </div>

            <button
              type="button"
              onClick={handleCompleteTutorial}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              使い始めてみる 🚀
            </button>
          </div>
        </div>
      )}

      {selectedHistoryDriveData && (
        <div
          onClick={() => setSelectedHistoryDriveData(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4 cursor-default shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-indigo-900">
                ☁️ 送信履歴データ保存（{selectedHistoryDriveData.profile?.username} / {new Date(selectedHistoryDriveData.sent_at).toLocaleString()}）
              </h3>
              <button
                onClick={() => setSelectedHistoryDriveData(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-[11px] max-h-64 overflow-y-auto">
              <pre>{JSON.stringify(selectedHistoryDriveData, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedHistoryDriveData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeHistoryDriveSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
              >
                💾 このデータを保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMediaDetail && (
        <div
          onClick={() => setSelectedMediaDetail(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-5 max-w-xl w-full space-y-4 cursor-default shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">✨ メディア詳細・一言コメント編集</h3>
              <button
                onClick={() => setSelectedMediaDetail(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center bg-black/5 rounded-lg p-2 overflow-hidden max-h-[50vh]">
              {selectedMediaDetail.type === 'video' ? (
                <video src={selectedMediaDetail.url} controls className="max-h-[45vh] object-contain rounded-lg" />
              ) : (
                <img src={selectedMediaDetail.url} alt="拡大表示" className="max-h-[45vh] object-contain rounded-lg" />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">一言コメント</label>
              <input
                type="text"
                value={selectedMediaDetail.comment || ''}
                onChange={(e) => handleUpdateMediaComment(selectedMediaDetail.recordId, selectedMediaDetail.itemId, e.target.value)}
                placeholder="コメントを入力..."
                className="w-full p-2.5 border rounded-lg text-xs bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  handleItemMediaDelete(selectedMediaDetail.recordId, selectedMediaDetail.itemId)
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setSelectedMediaDetail(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {modalImageUrl && (
        <div
          onClick={() => setModalImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white p-4">
            <img src={modalImageUrl} alt="拡大表示" className="w-full h-full object-contain max-h-[80vh] rounded-lg" />
            <p className="text-center text-gray-500 text-xs mt-2">画面をタップして閉じる</p>
          </div>
        </div>
      )}

      {showSendModal && (
        <div
          onClick={() => {
            if (!sendingToAdmin) setShowSendModal(false)
          }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-xl cursor-default max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">課題証拠の提出確認</h3>
            <p className="text-xs text-gray-600">
              撮影した写真・動画に文章や性癖を紐付けて提出できます。
            </p>

            <div className="space-y-2 border p-3 rounded-lg bg-gray-50 text-xs">
              <label className="flex items-center justify-between cursor-pointer font-semibold py-1 border-b">
                <span>基本プロフィールを含める</span>
                <input
                  type="checkbox"
                  checked={sendToggles.base_profile}
                  onChange={(e) => setSendToggles({ ...sendToggles, base_profile: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer font-semibold py-1 border-b">
                <span>調教課題の回答と証拠メディア</span>
                <input
                  type="checkbox"
                  checked={sendToggles.topic_answer}
                  onChange={(e) => setSendToggles({ ...sendToggles, topic_answer: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer font-semibold py-1">
                <span>マゾ向け項目一式を含める</span>
                <input
                  type="checkbox"
                  checked={sendToggles.customs_all}
                  onChange={(e) => setSendToggles({ ...sendToggles, customs_all: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>

            <div className="space-y-3 border p-3 rounded-lg bg-indigo-50/30">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="font-bold text-xs text-indigo-950">📁 証拠写真・動画の追加</label>
                <div className="flex gap-1.5 flex-wrap">
                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-sm transition">
                    📸 撮影する
                    <input type="file" accept="image/*,video/*" capture="environment" onChange={handleMultipleModalMediaChange} className="hidden" />
                  </label>
                  <label className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border shadow-sm transition">
                    📁 ファイル選択
                    <input type="file" accept="image/*,video/*" multiple onChange={handleMultipleModalMediaChange} className="hidden" />
                  </label>
                </div>
              </div>

              {modalMediaItems.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4 bg-white border border-dashed rounded-lg">
                  まだ写真・動画が選択されていません。
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {modalMediaItems.map((media, idx) => (
                      <div
                        key={media.id}
                        onClick={() => setActiveMediaIdForCheck(media.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer shrink-0 transition ${
                          activeMediaIdForCheck === media.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'
                        }`}
                      >
                        <img src={media.preview} alt="サムネイル" className="w-8 h-8 object-cover rounded" />
                        <span className="text-xs font-bold pr-1">ファイル #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeModalMediaItem(media.id)
                          }}
                          className="text-xs px-1 hover:text-red-300 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {activeMediaItem && (
                    <div className="bg-white p-3 rounded-lg border space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={activeMediaItem.preview} alt="プレビュー" className="w-14 h-14 object-cover rounded-lg border" />
                        <div className="flex-1 space-y-1">
                          <label className="block text-[11px] font-bold text-gray-700">添えるコメント</label>
                          <input
                            type="text"
                            value={activeMediaItem.comment}
                            onChange={(e) => updateModalMediaComment(activeMediaItem.id, e.target.value)}
                            placeholder="コメントを入力..."
                            className="w-full p-2 border rounded text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-indigo-900">関連する性癖の紐付け</span>
                          <input
                            type="text"
                            value={modalCategorySearch}
                            onChange={(e) => setModalCategorySearch(e.target.value)}
                            placeholder="🔍 項目を検索..."
                            className="px-2 py-1 text-[11px] border rounded bg-gray-50 w-36"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-gray-50/50">
                          {parentCategories.map((parent) => {
                            const subCats = getSubCategories(parent.id)
                            return (
                              <div key={parent.id} className="border rounded bg-white overflow-hidden text-xs">
                                <button
                                  type="button"
                                  onClick={() => toggleModalCategory(parent.id)}
                                  className="w-full p-1.5 bg-gray-100 flex justify-between items-center font-bold text-left text-[11px]"
                                >
                                  <span>{parent.title}</span>
                                  <span className="text-[10px] text-gray-400">{modalOpenCategories[parent.id] ? '▲' : '▼'}</span>
                                </button>

                                {modalOpenCategories[parent.id] && (
                                  <div className="p-2 space-y-2 border-t bg-white">
                                    {subCats.map((sub) => {
                                      const items = getChildItems(sub.id).filter((item) => {
                                        if (!normalizedModalQuery) return true
                                        return normalizeText(item.title).includes(normalizedModalQuery) || normalizeText(sub.title).includes(normalizedModalQuery)
                                      })

                                      if (normalizedModalQuery && items.length === 0) return null

                                      return (
                                        <div key={sub.id} className="space-y-1 pl-1">
                                          <div className="font-semibold text-indigo-800 text-[10px]">📂 {sub.title}</div>
                                          <div className="space-y-1 pl-2">
                                            {items.map((item) => {
                                              const isChecked = !!activeMediaItem.selectedItemIds[item.id]
                                              return (
                                                <label key={item.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0 cursor-pointer">
                                                  <span className="text-[11px] font-medium text-gray-800">{item.title}</span>
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleMediaItemCheck(activeMediaItem.id, item.id)}
                                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                                                  />
                                                </label>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSendModal(false)}
                disabled={sendingToAdmin}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-medium rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={executeSendToAdmin}
                disabled={sendingToAdmin}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow"
              >
                {sendingToAdmin ? '提出中...' : '提出を実行する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center border-b pb-4 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">性癖メモ</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {user ? (
            <>
              <button
                onClick={() => setActiveTab('main')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded font-medium ${activeTab === 'main' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                メイン
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded font-medium ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                📋 性癖一覧
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded font-medium ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                設定
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab('admin')
                    fetchAllSendHistory()
                  }}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded font-medium ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  📊 管理・ストック
                </button>
              )}
              <button onClick={handleLogout} className="px-3 py-1.5 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium">
                ログアウト
              </button>
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs sm:text-sm bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg shadow transition flex items-center gap-1"
              >
                💡 性癖追加・お題提案 ↗
              </a>
            </>
          ) : null}
        </div>
      </header>

      {!user ? (
        <section className="text-center py-12 space-y-4 border rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-semibold">ログインして始める</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <button onClick={() => handleLogin('google')} className="px-6 py-2.5 bg-white border rounded-lg shadow-sm font-medium text-black text-sm">
              Googleでログイン
            </button>
            <button onClick={() => handleLogin('x')} className="px-6 py-2.5 bg-black text-white rounded-lg shadow-sm font-medium text-sm">
              X（Twitter）でログイン
            </button>
          </div>
        </section>
      ) : activeTab === 'settings' ? (
        <section className="border p-6 rounded-xl space-y-6 bg-white shadow-sm">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold text-indigo-600">プロフィール設定</h2>
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-200"
            >
              📖 使い方をもう一度見る
            </button>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold mb-1">ユーザーネーム</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">アイコン画像</label>
              <div className="flex items-center gap-4 mb-2">
                {avatarPreview || profile.avatar_url ? (
                  <img
                    src={avatarPreview || profile.avatar_url}
                    alt="アイコン"
                    onClick={() => setModalImageUrl(avatarPreview || profile.avatar_url)}
                    className="w-14 h-14 rounded-full object-cover border cursor-pointer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 border flex items-center justify-center text-xs text-gray-400">未設定</div>
                )}
                <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border">
                  📷 画像を選択
                  <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">自己紹介</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>

            <div className="p-3 border rounded-lg bg-gray-50/50 space-y-1">
              <label className="font-semibold text-xs text-gray-700 block">性別</label>
              <select
                value={customValues['field_gender'] || ''}
                onChange={(e) => setCustomValues({ ...customValues, field_gender: e.target.value })}
                className="w-full p-2 border rounded-lg text-xs bg-white"
              >
                {!customValues['field_gender'] && <option value="">選択してください</option>}
                <option value="男性">男性</option>
                <option value="女性">女性</option>
              </select>
            </div>

            <div className="p-3 border rounded-lg bg-gray-50/50 space-y-1">
              <label className="font-semibold text-xs text-gray-700 block">性的指向</label>
              <select
                value={customValues['field_sexuality'] || ''}
                onChange={(e) => setCustomValues({ ...customValues, field_sexuality: e.target.value })}
                className="w-full p-2 border rounded-lg text-xs bg-white"
              >
                {!customValues['field_sexuality'] && <option value="">選択してください</option>}
                <option value="ノンケ">ノンケ</option>
                <option value="バイ">バイ</option>
                <option value={customValues['field_gender'] === '女性' ? 'レズビアン' : customValues['field_gender'] === '男性' ? 'ゲイ' : 'クィア'}>
                  {customValues['field_gender'] === '女性' ? 'レズビアン' : customValues['field_gender'] === '男性' ? 'ゲイ' : 'クィア'}
                </option>
              </select>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm">{masochistSectionTitle}</h3>
                  <p className="text-[11px] text-gray-500">マゾ向けカスタム項目全体をまとめてON/OFFできます。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customsGlobalEnabled}
                    onChange={(e) => setCustomsGlobalEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-xs font-bold text-gray-700">{customsGlobalEnabled ? 'ON' : 'OFF'}</span>
                </label>
              </div>

              {customsGlobalEnabled && (
                <div className="space-y-3 pt-2">
                  {!masochistUnlocked ? (
                    <div className="border border-pink-200 bg-pink-50/50 p-4 rounded-xl space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-pink-900">⚠️ マゾ奴隷 契約・厳格宣誓の書</h4>
                        <p className="text-[11px] text-gray-600">
                          この先のマゾ向け機密項目を開くには、以下の詳細な誓約書を一番下までスクロールして熟読し、すべての規定を厳守すると誓った上で指定の合言葉を入力してください。
                        </p>
                      </div>

                      <div
                        ref={contractBoxRef}
                        onScroll={(e) => {
                          const target = e.currentTarget
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 5) {
                            setHasScrolledToBottom(true)
                          }
                        }}
                        className="bg-white border rounded-lg p-3.5 text-[11px] text-gray-700 space-y-2.5 max-h-52 overflow-y-auto leading-relaxed shadow-inner"
                      >
                        <p className="font-bold text-pink-900 text-center border-b pb-1.5">〜 マゾヒスト専用 支配・従属および遵守に関する厳格な誓約書 〜</p>
                        <p><strong>第1条（総則）</strong><br />本規約は、当アプリ内においてマゾヒズムおよび主従関係に関連する全ての機密項目へアクセスし、自己の性癖を深く記録・管理するすべての利用者が、絶対的な服従と自己管理の義務を遂行することを誓うものです。</p>
                        <p><strong>第2条（尊厳の放棄と自己決定権の委譲）</strong><br />利用者は、自らのプライド、羞恥心、および無駄な防衛本能を完全に排除・放棄し、主導権を管理システムおよび上位の存在に委ねることに全面的に同意するものとします。</p>
                        <p><strong>第3条（叱責および苦痛の甘受）</strong><br />日々の調教課題、厳しいお仕置き、または露出・拘束などの恥ずかしい状況に直面した際、利用者は一切の不平不満を禁じられ、それらをすべて無上の歓喜として積極的に受容しなければなりません。</p>
                        <p><strong>第4条（機密データの献上義務）</strong><br />身体測定値、M歴、内面の弱み、および日々の調教で撮影された一切の写真・動画データは、厳重に管理されると同時に、管理者の正当な玩具・閲覧対象としてすべて真実を偽りなく提出・献上することを義務付けます。</p>
                        <p><strong>第5条（秘密保持と外部漏洩の禁止）</strong><br />本エリアで開示されるすべての課題、特殊ルール、および記録内容は極秘事項とし、外部への一切の漏洩を厳禁とします。</p>
                        <p><strong>第6条（最終合言葉の誓約）</strong><br />上記のすべての条項を熟読し、自らが紛れもないマゾヒストであることを心底から自覚した者のみが、パスワード欄に<span>「私はマゾです」</span>と正確に入力し、扉を開くことが許されます。</p>
                      </div>

                      {!hasScrolledToBottom && (
                        <p className="text-[10px] text-pink-700 font-bold text-center animate-pulse">
                          ⬇️ 誓約書を一番下までスクロールしてください
                        </p>
                      )}

                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-800 mb-1">
                            🔐 合言葉を入力してください:
                          </label>
                          <input
                            type="text"
                            value={masochistInputPw}
                            onChange={(e) => {
                              setMasochistInputPw(e.target.value)
                              setMasochistAuthError(false)
                            }}
                            placeholder="合言葉を入力..."
                            className="w-full p-2.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-pink-500"
                          />
                        </div>

                        <label className={`flex items-center gap-2 pt-1 ${!hasScrolledToBottom ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            disabled={!hasScrolledToBottom}
                            checked={masochistAgreed}
                            onChange={(e) => setMasochistAgreed(e.target.checked)}
                            className="w-4 h-4 text-pink-600 rounded cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-[11px] font-bold text-gray-900">
                            {hasScrolledToBottom ? '上記の厳格な誓約書の全条項に同意し、絶対服従を誓います' : '（※誓約書を一番下までスクロールするとチェックできます）'}
                          </span>
                        </label>

                        {masochistAuthError && (
                          <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded">
                            ❌ 合言葉が違うか、同意チェックが入っていません。
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (masochistInputPw.trim() === '私はマゾです' && masochistAgreed) {
                              setMasochistUnlocked(true)
                              setMasochistAuthError(false)
                            } else {
                              setMasochistAuthError(true)
                            }
                          }}
                          className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg shadow transition"
                        >
                          🔓 マゾ向け項目を解放する
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {CUSTOM_FIELD_CONFIGS.map((field) => {
                        if (field.condition) {
                          const currentGenderVal = customValues[field.condition.field]
                          if (currentGenderVal !== field.condition.value) {
                            return null
                          }
                        }

                        return (
                          <div key={field.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-1">
                            <label className="font-semibold text-xs text-gray-700 block">{field.label}</label>
                            {field.type === 'image' ? (
                              <div className="space-y-2 pt-1">
                                {customImagePreviews[field.id] && customImagePreviews[field.id].length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {customImagePreviews[field.id].map((previewUrl, idx) => (
                                      <div key={idx} className="relative inline-block">
                                        <img
                                          src={previewUrl}
                                          alt={`プレビュー ${idx + 1}`}
                                          onClick={() => setModalImageUrl(previewUrl)}
                                          className="w-14 h-14 object-cover rounded-lg border cursor-pointer"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomImage(field.id, idx)}
                                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow hover:bg-red-700"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <label className="inline-flex px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border shadow-sm items-center gap-1.5">
                                  📁 画像/動画を追加
                                  <input type="file" accept="image/*,video/*" multiple onChange={(e) => handleCustomImagesChange(field.id, e)} className="hidden" />
                                </label>
                              </div>
                            ) : field.type === 'date' ? (
                              <input
                                type="date"
                                value={customValues[field.id] || ''}
                                onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                                className="w-full p-2 border rounded-lg text-xs bg-white"
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={customValues[field.id] || ''}
                                onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                                className="w-full p-2 border rounded-lg text-xs bg-white"
                              >
                                <option value="">選択してください</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                rows={3}
                                value={customValues[field.id] || ''}
                                onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                                placeholder={field.placeholder || `${field.label}の内容を入力...`}
                                className="w-full p-2 border rounded-lg text-xs bg-white"
                              />
                            ) : (
                              <input
                                type={field.type || 'text'}
                                value={customValues[field.id] || ''}
                                onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                                placeholder={field.placeholder || `${field.label}の内容を入力...`}
                                className="w-full p-2 border rounded-lg text-xs bg-white"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2">
              <label className="block font-semibold text-gray-700">送信ボタンの動作設定</label>
              <div className="flex flex-col gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="send_mode"
                    value="fake"
                    checked={profile.send_mode === 'fake'}
                    onChange={(e) => setProfile({ ...profile, send_mode: e.target.value })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>送信演出モード（デフォルト）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="send_mode"
                    value="real"
                    checked={profile.send_mode === 'real'}
                    onChange={(e) => setProfile({ ...profile, send_mode: e.target.value })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>実送信モード</span>
                </label>
              </div>
            </div>
            
            <button type="submit" disabled={savingProfile} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium">
              {savingProfile ? '保存中...' : '設定を保存'}
            </button>
          </form>

          <FeedbackFooter />
        </section>
      ) : activeTab === 'list' ? (
        <section className="border p-6 rounded-xl space-y-6 bg-white shadow-sm">
          <div className="border-b pb-3 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-indigo-600">📋 性癖一覧</h2>
                <p className="text-xs text-gray-500 mt-0.5">左側のチェックボックスを独立して動かせます。</p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  placeholder="🔍 項目を検索 (例: バイブ)"
                  className="w-full px-3 py-1.5 pl-8 text-xs border rounded-lg bg-gray-50 focus:bg-white transition"
                />
                <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
                {listSearchQuery && (
                  <button
                    onClick={() => setListSearchQuery('')}
                    className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-600 px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs pt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> 興味あり</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span> 好きなプレイ</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> 経験あり</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-pink-500 rounded-full inline-block"></span> 大好物</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full inline-block"></span> 所持（※道具・衣装のみ）</span>
            </div>
          </div>

          <div className="space-y-4">
            {parentCategories.map((parent) => {
              const subCategories = getSubCategories(parent.id)

              const matchedSubCategories = subCategories.map((sub) => {
                const childItems = getChildItems(sub.id)
                const filteredItems = childItems.filter((item) => {
                  if (!listSearchQuery) return true
                  return (
                    normalizeText(item.title).includes(normalizedListQuery) ||
                    normalizeText(sub.title).includes(normalizedListQuery) ||
                    normalizeText(parent.title).includes(normalizedListQuery)
                  )
                })
                return { sub, filteredItems }
              }).filter((s) => s.filteredItems.length > 0 || (listSearchQuery && normalizeText(s.sub.title).includes(normalizedListQuery)))

              const isParentMatched = listSearchQuery ? (matchedSubCategories.length > 0 || normalizeText(parent.title).includes(normalizedListQuery)) : true

              if (listSearchQuery && !isParentMatched) return null

              const isOpen = listSearchQuery ? true : !!openCategories[parent.id]

              return (
                <div key={parent.id} className="border rounded-lg overflow-hidden mb-4 shadow-sm">
                  <button
                    onClick={() => toggleCategory(parent.id)}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center font-bold text-sm text-left transition"
                  >
                    <span>📁 {parent.title} {listSearchQuery && <span className="text-xs text-indigo-600 font-normal">（ヒットあり）</span>}</span>
                    <span className="text-xs text-gray-500">{isOpen ? '▲ 閉じる' : '▼ 開く'}</span>
                  </button>

                  {isOpen && (
                    <div className="p-3 bg-white space-y-3 border-t">
                      {subCategories.map((sub) => {
                        const childItems = getChildItems(sub.id)
                        const filteredItems = childItems.filter((item) => {
                          if (!listSearchQuery) return true
                          return (
                            normalizeText(item.title).includes(normalizedListQuery) ||
                            normalizeText(sub.title).includes(normalizedListQuery)
                          )
                        })

                        const isSubMatch = listSearchQuery && normalizeText(sub.title).includes(normalizedListQuery)
                        const targetItems = isSubMatch && listSearchQuery ? childItems : filteredItems

                        if (listSearchQuery && targetItems.length === 0) return null

                        const isSubOpen = listSearchQuery ? true : (openSubCategories[sub.id] ?? true)
                        
                        const isGearOrCostume = normalizeText(sub.title).includes('道具') || 
                                                normalizeText(sub.title).includes('衣装') || 
                                                normalizeText(parent.title).includes('道具') || 
                                                normalizeText(parent.title).includes('衣装')

                        return (
                          <div key={sub.id} className="border rounded-lg overflow-hidden bg-gray-50/50">
                            <button
                              onClick={() => toggleSubCategory(sub.id)}
                              className="w-full px-3 py-2 bg-indigo-50/80 hover:bg-indigo-100/70 flex justify-between items-center text-xs font-bold text-indigo-900 text-left transition"
                            >
                              <span>📂 {sub.title} <span className="text-gray-500 font-normal">({targetItems.length}項目)</span></span>
                              <span className="text-[10px] text-indigo-700">{isSubOpen ? '▲ 最小化' : '▼ 展開'}</span>
                            </button>

                            {isSubOpen && (
                              <div className="p-2.5 bg-white space-y-2 border-t">
                                {targetItems.map((item) => {
                                  const activeStatuses = checks[item.id] || []
                                  const isManuallyChecked = !!manualIndependentChecks[item.id]
                                  const itemMedias = itemMediaMap[item.id] || []

                                  return (
                                    <div key={item.id} className="p-2.5 border rounded-lg flex flex-col gap-2.5 bg-gray-50/30">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleManualCheckToggle(item.id)}
                                            className={`w-5 h-5 flex items-center justify-center border font-mono text-xs rounded cursor-pointer transition ${
                                              isManuallyChecked 
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs' 
                                                : 'bg-white text-transparent border-gray-300 hover:border-indigo-400'
                                            }`}
                                          >
                                            {isManuallyChecked ? '✓' : ''}
                                          </button>
                                          <span className="text-xs sm:text-sm font-medium text-gray-800">
                                            {item.title}
                                          </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5 text-xs items-center">
                                          {Object.keys(STATUS_COLORS).map((statusKey) => {
                                            if (statusKey === 'owned' && !isGearOrCostume) return null

                                            const conf = STATUS_COLORS[statusKey]
                                            const isSelected = activeStatuses.includes(statusKey)
                                            return (
                                              <button
                                                key={statusKey}
                                                type="button"
                                                disabled={savingId === item.id}
                                                onClick={() => handleCheckToggle(item.id, statusKey)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition shadow-2xs ${
                                                  isSelected 
                                                    ? `${conf.bgClass} text-white border-transparent shadow-xs ring-1 ring-black/10` 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                              >
                                                {conf.label}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>

                                      <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                                        {itemMedias.length > 0 && (
                                          <div className="flex flex-wrap gap-2.5">
                                            {itemMedias.map((media) => (
                                              <div
                                                key={media.id}
                                                className="relative inline-block group"
                                              >
                                                <div
                                                  onClick={() => setSelectedMediaDetail({ recordId: media.id, itemId: item.id, url: media.media_url, type: media.media_type, comment: media.comment })}
                                                  className="flex items-center gap-2 p-1.5 bg-white rounded-lg border shadow-sm cursor-pointer hover:border-indigo-500 transition max-w-xs pr-6"
                                                >
                                                  {media.media_type === 'video' ? (
                                                    <video src={media.media_url} className="w-12 h-12 object-cover rounded border shrink-0" />
                                                  ) : (
                                                    <img src={media.media_url} alt="メディア" className="w-12 h-12 object-cover rounded border shrink-0" />
                                                  )}
                                                  <div className="overflow-hidden pr-1">
                                                    <p className="text-[10px] text-indigo-600 font-bold truncate">タップして拡大・編集</p>
                                                    <p className="text-[11px] text-gray-700 truncate">{media.comment || '（コメントなし）'}</p>
                                                  </div>
                                                </div>
                                                
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleItemMediaDelete(media.id, item.id)
                                                  }}
                                                  className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-700 transition z-10"
                                                  title="削除する"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 pt-1">
                                          <label className={`inline-flex px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-sm items-center gap-1.5 transition ${uploadingItemId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                            📸 撮影する
                                            <input
                                              type="file"
                                              accept="image/*,video/*"
                                              capture="environment"
                                              onChange={(e) => handleItemMediaUpload(item.id, e)}
                                              className="hidden"
                                            />
                                          </label>

                                          <label className={`inline-flex px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border shadow-sm items-center gap-1.5 transition ${uploadingItemId === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                            📁 ファイル選択
                                            <input
                                              type="file"
                                              accept="image/*,video/*"
                                              multiple
                                              onChange={(e) => handleItemMediaUpload(item.id, e)}
                                              className="hidden"
                                            />
                                          </label>

                                          {uploadingItemId === item.id && (
                                            <span className="text-xs text-indigo-600 font-bold self-center">アップロード中...</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <FeedbackFooter />
        </section>
      ) : activeTab === 'admin' && isAdmin ? (
        <section className="border p-6 rounded-xl space-y-6 bg-white shadow-sm">
          <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-indigo-600">📊 管理者用：個別お題投稿・詳細設定 ＆ 履歴管理</h2>
              <p className="text-xs text-gray-500">スプレッドシート（CSVファイル）を直接アップロードして一括同期できます。</p>
            </div>
            <button
              onClick={fetchAllSendHistory}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded font-medium"
            >
              🔄 履歴更新
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
              <h3 className="font-bold text-xs text-indigo-950">📝 一般用 お題新規登録・設定</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-semibold mb-1">タイトル</label>
                  <input
                    type="text"
                    value={adminFormNormal.title}
                    onChange={(e) => setAdminFormNormal({ ...adminFormNormal, title: e.target.value })}
                    placeholder="例: 【調教課題002】"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">文章（お題内容）</label>
                  <textarea
                    rows={3}
                    value={adminFormNormal.description}
                    onChange={(e) => setAdminFormNormal({ ...adminFormNormal, description: e.target.value })}
                    placeholder="お題の詳細内容..."
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">追加機能の種類</label>
                    <select
                      value={adminFormNormal.extra_feature}
                      onChange={(e) => setAdminFormNormal({ ...adminFormNormal, extra_feature: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="なし">なし</option>
                      <option value="サイコロ">サイコロ</option>
                      <option value="タイマー">タイマー</option>
                      <option value="ルーレット">ルーレット</option>
                      <option value="スロットマシン">スロットマシン</option>
                      <option value="ペナルティランダム罰">ペナルティランダム罰</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">難易度 (1〜5)</label>
                    <select
                      value={adminFormNormal.difficulty}
                      onChange={(e) => setAdminFormNormal({ ...adminFormNormal, difficulty: Number(e.target.value) })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value={1}>1 ({renderHearts(1)})</option>
                      <option value={2}>2 ({renderHearts(2)})</option>
                      <option value={3}>3 ({renderHearts(3)})</option>
                      <option value={4}>4 ({renderHearts(4)})</option>
                      <option value={5}>5 ({renderHearts(5)})</option>
                    </select>
                  </div>
                </div>

                {adminFormNormal.extra_feature === 'サイコロ' && (
                  <div>
                    <label className="block font-semibold mb-1">🎲 サイコロの最大面数（例: 6, 10, 20など）</label>
                    <input
                      type="number"
                      min={2}
                      value={adminFormNormal.dice_max}
                      onChange={(e) => setAdminFormNormal({ ...adminFormNormal, dice_max: Number(e.target.value) || 6 })}
                      className="w-full p-2 border rounded bg-white font-mono"
                    />
                  </div>
                )}

                {adminFormNormal.extra_feature === 'スロットマシン' ? (
                  <div className="space-y-3 bg-white p-3 rounded border">
                    <p className="font-bold text-indigo-900 border-b pb-1">🎰 スロット 項目別候補設定（1行に1つ）</p>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【いつ】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhen}
                        onChange={(e) => setAdminSlotWhen(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【どこで】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhere}
                        onChange={(e) => setAdminSlotWhere(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-[11px]">【だれと】を含めるか</label>
                        <input
                          type="checkbox"
                          checked={adminSlotWhoEnabled}
                          onChange={(e) => setAdminSlotWhoEnabled(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </div>
                      {adminSlotWhoEnabled && (
                        <textarea
                          rows={2}
                          value={adminSlotWho}
                          onChange={(e) => setAdminSlotWho(e.target.value)}
                          placeholder="だれとの候補..."
                          className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【なに】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhat}
                        onChange={(e) => setAdminSlotWhat(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1">
                      {adminFormNormal.extra_feature === 'サイコロ' && '🎲 出目ごとの結果（例: 1〜3：ノーパン）'}
                      {adminFormNormal.extra_feature === 'タイマー' && '⏱️ 制限時間（秒数。例: 300）'}
                      {adminFormNormal.extra_feature === 'ルーレット' && '🎡 ルーレットの選択肢（1行に1つ）'}
                      {adminFormNormal.extra_feature === 'ペナルティランダム罰' && '⚡ 罰ゲームの候補（1行に1つ）'}
                      {adminFormNormal.extra_feature === 'なし' && '分岐ルール'}
                    </label>
                    {adminFormNormal.extra_feature === 'タイマー' ? (
                      <input
                        type="number"
                        value={adminFormNormal.feature_config_text}
                        onChange={(e) => setAdminFormNormal({ ...adminFormNormal, feature_config_text: e.target.value })}
                        placeholder="300"
                        className="w-full p-2 border rounded bg-white font-mono"
                      />
                    ) : (
                      <textarea
                        rows={3}
                        value={adminFormNormal.feature_config_text}
                        onChange={(e) => setAdminFormNormal({ ...adminFormNormal, feature_config_text: e.target.value })}
                        placeholder="候補やルールを1行ずつ入力..."
                        className="w-full p-2 border rounded bg-white font-mono"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">カテゴリー選択（複数選択可）</label>
                  <div className="flex flex-wrap gap-2 bg-white p-2 border rounded">
                    {TOPIC_CATEGORIES.map((cat) => {
                      const checked = adminFormNormal.categories.includes(cat.id)
                      return (
                        <label key={cat.id} className="flex items-center gap-1 cursor-pointer bg-gray-50 px-2 py-1 rounded border">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const current = adminFormNormal.categories
                              if (e.target.checked) {
                                setAdminFormNormal({ ...adminFormNormal, categories: [...current, cat.id] })
                              } else {
                                setAdminFormNormal({ ...adminFormNormal, categories: current.filter(id => id !== cat.id) })
                              }
                            }}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <span className="text-[11px]">{cat.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">投稿日時（カレンダー）</label>
                    <input
                      type="date"
                      value={adminFormNormal.topic_date}
                      onChange={(e) => setAdminFormNormal({ ...adminFormNormal, topic_date: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ステータス</label>
                    <select
                      value={adminFormNormal.status}
                      onChange={(e) => setAdminFormNormal({ ...adminFormNormal, status: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="published">公開（本日の課題）</option>
                      <option value="stock">ストック</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateTopicAdmin('normal')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition mt-2"
                >
                  🚀 一般用お題を投稿・登録
                </button>
              </div>
            </div>

            <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100 space-y-3">
              <h3 className="font-bold text-xs text-pink-950">🖤 マゾ用 お題新規登録・設定</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-semibold mb-1">タイトル</label>
                  <input
                    type="text"
                    value={adminFormMasochist.title}
                    onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, title: e.target.value })}
                    placeholder="例: 【マゾ課題002】"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">文章（お題内容）</label>
                  <textarea
                    rows={3}
                    value={adminFormMasochist.description}
                    onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, description: e.target.value })}
                    placeholder="マゾ専用お題の詳細内容..."
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">追加機能の種類</label>
                    <select
                      value={adminFormMasochist.extra_feature}
                      onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, extra_feature: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="なし">なし</option>
                      <option value="ペナルティランダム罰">ペナルティランダム罰</option>
                      <option value="サイコロ">サイコロ</option>
                      <option value="タイマー">タイマー</option>
                      <option value="ルーレット">ルーレット</option>
                      <option value="スロットマシン">スロットマシン</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">難易度 (1〜5)</label>
                    <select
                      value={adminFormMasochist.difficulty}
                      onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, difficulty: Number(e.target.value) })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value={1}>1 ({renderHearts(1)})</option>
                      <option value={2}>2 ({renderHearts(2)})</option>
                      <option value={3}>3 ({renderHearts(3)})</option>
                      <option value={4}>4 ({renderHearts(4)})</option>
                      <option value={5}>5 ({renderHearts(5)})</option>
                    </select>
                  </div>
                </div>

                {adminFormMasochist.extra_feature === 'サイコロ' && (
                  <div>
                    <label className="block font-semibold mb-1">🎲 サイコロの最大面数（例: 6, 10, 20など）</label>
                    <input
                      type="number"
                      min={2}
                      value={adminFormMasochist.dice_max}
                      onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, dice_max: Number(e.target.value) || 6 })}
                      className="w-full p-2 border rounded bg-white font-mono"
                    />
                  </div>
                )}

                {adminFormMasochist.extra_feature === 'スロットマシン' ? (
                  <div className="space-y-3 bg-white p-3 rounded border">
                    <p className="font-bold text-pink-900 border-b pb-1">🎰 スロット 項目別候補設定（1行に1つ）</p>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【いつ】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhen}
                        onChange={(e) => setAdminSlotWhen(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【どこで】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhere}
                        onChange={(e) => setAdminSlotWhere(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold text-[11px]">【だれと】を含めるか</label>
                        <input
                          type="checkbox"
                          checked={adminSlotWhoEnabled}
                          onChange={(e) => setAdminSlotWhoEnabled(e.target.checked)}
                          className="w-4 h-4 text-pink-600 rounded"
                        />
                      </div>
                      {adminSlotWhoEnabled && (
                        <textarea
                          rows={2}
                          value={adminSlotWho}
                          onChange={(e) => setAdminSlotWho(e.target.value)}
                          placeholder="だれとの候補..."
                          className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">【なに】の候補</label>
                      <textarea
                        rows={2}
                        value={adminSlotWhat}
                        onChange={(e) => setAdminSlotWhat(e.target.value)}
                        className="w-full p-1.5 border rounded bg-gray-50 font-mono text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-1">
                      {adminFormMasochist.extra_feature === 'サイコロ' && '🎲 出目ごとの結果'}
                      {adminFormMasochist.extra_feature === 'タイマー' && '⏱️ 制限時間（秒数）'}
                      {adminFormMasochist.extra_feature === 'ルーレット' && '🎡 ルーレットの選択肢（1行に1つ）'}
                      {adminFormMasochist.extra_feature === 'ペナルティランダム罰' && '⚡ 罰ゲームの候補（1行に1つ）'}
                      {adminFormMasochist.extra_feature === 'なし' && '分岐ルール'}
                    </label>
                    {adminFormMasochist.extra_feature === 'タイマー' ? (
                      <input
                        type="number"
                        value={adminFormMasochist.feature_config_text}
                        onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, feature_config_text: e.target.value })}
                        placeholder="300"
                        className="w-full p-2 border rounded bg-white font-mono"
                      />
                    ) : (
                      <textarea
                        rows={3}
                        value={adminFormMasochist.feature_config_text}
                        onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, feature_config_text: e.target.value })}
                        placeholder="候補やルールを1行ずつ入力..."
                        className="w-full p-2 border rounded bg-white font-mono"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">カテゴリー選択（複数選択可）</label>
                  <div className="flex flex-wrap gap-2 bg-white p-2 border rounded">
                    {TOPIC_CATEGORIES.map((cat) => {
                      const checked = adminFormMasochist.categories.includes(cat.id)
                      return (
                        <label key={cat.id} className="flex items-center gap-1 cursor-pointer bg-gray-50 px-2 py-1 rounded border">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const current = adminFormMasochist.categories
                              if (e.target.checked) {
                                setAdminFormMasochist({ ...adminFormMasochist, categories: [...current, cat.id] })
                              } else {
                                setAdminFormMasochist({ ...adminFormMasochist, categories: current.filter(id => id !== cat.id) })
                              }
                            }}
                            className="w-3.5 h-3.5 text-pink-600 rounded"
                          />
                          <span className="text-[11px]">{cat.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">投稿日時（カレンダー）</label>
                    <input
                      type="date"
                      value={adminFormMasochist.topic_date}
                      onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, topic_date: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ステータス</label>
                    <select
                      value={adminFormMasochist.status}
                      onChange={(e) => setAdminFormMasochist({ ...adminFormMasochist, status: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                    >
                      <option value="published">公開（本日の課題）</option>
                      <option value="stock">ストック</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateTopicAdmin('masochist')}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded shadow transition mt-2"
                >
                  🚀 マゾ用お題を投稿・登録
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-xs text-gray-800">📈 スプレッドシート一括インポート（CSVファイル選択 or 貼り付け）</h3>
              <label className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow transition flex items-center gap-1.5">
                📁 スプレッドシートファイルを選択
                <input type="file" accept=".csv,text/csv" onChange={handleFileUploadForSync} className="hidden" />
              </label>
            </div>
            <textarea
              rows={3}
              value={sheetCsvInput}
              onChange={(e) => setSheetCsvInput(e.target.value)}
              placeholder="例: 【調教課題】&#9;本文...&#9;2026-09-12&#9;published&#9;normal&#9;3&#9;サイコロ&#9;1〜2：ノーパン;3〜4：ノーブラ;5〜6：ノーパンノーブラ&#9;training;exposure"
              className="w-full p-2 border rounded text-xs bg-white font-mono"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleImportSpreadsheetCsv()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
              >
                📥 CSV一括同期する
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-xs text-gray-800">📦 現在ストック・予約中のお題 ({stockPrompts.length}件)</h3>
            <div className="space-y-2">
              {stockPrompts.map((st, i) => (
                <div key={i} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-indigo-900">{st.title}</span> 
                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded ${st.target_type === 'masochist' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {st.target_type === 'masochist' ? 'マゾ向け' : '一般向け'}
                    </span>
                    <span className="text-[10px] ml-2 text-pink-600 font-bold">難易度: {renderHearts(st.difficulty)}</span>
                    <p className="text-[11px] text-gray-500 whitespace-pre-line line-clamp-1">{st.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded text-[10px]">ストック中</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-bold text-xs text-gray-800">ユーザーからの課題提出・送信履歴</h3>
            {allSendHistory.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">まだ提出履歴がありません。</p>
            ) : (
              <div className="space-y-4">
                {allSendHistory.map((historyItem, idx) => (
                  <div key={idx} className="border p-4 rounded-xl bg-gray-50/50 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">提出 #${allSendHistory.length - idx}</span>
                          <h3 className="font-bold text-sm text-gray-900">
                            👤 {historyItem.profile?.username || '名無しさん'}
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">提出日時: {new Date(historyItem.sent_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrepareHistoryDriveSave(historyItem)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition"
                        >
                          ☁️ 保存
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(historyItem)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg shadow transition"
                        >
                          🗑️ 削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FeedbackFooter />
        </section>
      ) : (
        <section className="space-y-6">
          <div className="border p-5 sm:p-6 rounded-xl space-y-5 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              調教課題ミッション
            </div>

            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <button
                  onClick={() => setSelectedPromptTab('normal')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${selectedPromptTab === 'normal' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  📖 一般用のお題
                </button>
                {masochistUnlocked && (
                  <button
                    onClick={() => setSelectedPromptTab('masochist')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${selectedPromptTab === 'masochist' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700 border border-pink-200'}`}
                  >
                    🖤 マゾ用のお題（解放中）
                  </button>
                )}
                <button
                  onClick={() => setSelectedPromptTab('stock')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${selectedPromptTab === 'stock' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  ストック課題 ({stockPrompts.length})
                </button>
                <button
                  onClick={() => setSelectedPromptTab('archive')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${selectedPromptTab === 'archive' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  過去の課題
                </button>
              </div>

              {selectedPromptTab === 'normal' && prompt && (
                <div className="mt-3 p-4 bg-gradient-to-br from-pink-50/60 to-indigo-50/40 rounded-xl border border-pink-200/60 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-indigo-950">{prompt.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-pink-600 font-bold">難易度: {renderHearts(prompt.difficulty)}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">{new Date(prompt.topic_date).toLocaleDateString()}公開</span>
                    </div>
                  </div>

                  {prompt.categories && prompt.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.categories.map((cId: string) => {
                        const catObj = TOPIC_CATEGORIES.find(tc => tc.id === cId)
                        if (!catObj) return null
                        return (
                          <span key={cId} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                            #{catObj.label}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-gray-800 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-medium">
                    {prompt.description}
                  </div>

                  {renderExtraFeatureComponent(prompt)}
                </div>
              )}

              {selectedPromptTab === 'masochist' && masochistUnlocked && (
                <div className="mt-3 p-4 bg-gradient-to-br from-pink-100/70 to-purple-50/50 rounded-xl border border-pink-300 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-pink-950">{masochistPrompt.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-pink-600 text-white font-bold rounded-full">マゾ専用</span>
                      <span className="text-pink-700 font-bold">難易度: {renderHearts(masochistPrompt.difficulty)}</span>
                    </div>
                  </div>

                  {masochistPrompt.categories && masochistPrompt.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {masochistPrompt.categories.map((cId: string) => {
                        const catObj = TOPIC_CATEGORIES.find(tc => tc.id === cId)
                        if (!catObj) return null
                        return (
                          <span key={cId} className="px-2 py-0.5 bg-pink-100 text-pink-800 text-[10px] font-bold rounded-full">
                            #{catObj.label}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-gray-900 text-xs sm:text-sm whitespace-pre-line leading-relaxed font-medium">
                    {masochistPrompt.description}
                  </div>

                  {renderExtraFeatureComponent(masochistPrompt)}
                </div>
              )}

              {selectedPromptTab === 'stock' && (
                <div className="mt-3 space-y-2">
                  {stockPrompts.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">ストックされた課題はありません。</p>
                  ) : (
                    stockPrompts.map((st, i) => (
                      <div key={i} onClick={() => { 
                        if (st.target_type === 'masochist') {
                          if (!masochistUnlocked) {
                            alert('マゾ向け項目が解放されていません。「設定」からマゾ向け項目を有効にしてください。')
                            return
                          }
                          setMasochistPrompt(st)
                          setSelectedPromptTab('masochist')
                        } else {
                          setPrompt(st)
                          setSelectedPromptTab('normal')
                        }
                      }} className="p-3 border rounded-lg bg-gray-50 hover:bg-indigo-50/50 cursor-pointer transition">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-indigo-900">{st.title}</h4>
                          <div className="flex gap-2 items-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${st.target_type === 'masochist' ? 'bg-pink-100 text-pink-700' : 'bg-gray-200 text-gray-700'}`}>
                              {st.target_type === 'masochist' ? 'マゾ向け' : '一般向け'}
                            </span>
                            <span className="text-[10px] text-pink-600 font-bold">{renderHearts(st.difficulty)}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-600 line-clamp-1 whitespace-pre-line">{st.description}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedPromptTab === 'archive' && (
                <div className="mt-3 space-y-2">
                  {pastPrompts.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">過去に保持された課題はありません。</p>
                  ) : (
                    pastPrompts.map((past, i) => (
                      <div key={i} onClick={() => { setPrompt(past); setSelectedPromptTab('normal'); }} className="p-3 border rounded-lg bg-gray-50 hover:bg-indigo-50/50 cursor-pointer transition">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-indigo-900">{past.title}</h4>
                          <span className="text-[10px] text-gray-400">{new Date(past.topic_date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 line-clamp-1 whitespace-pre-line">{past.description}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t">
              <label className="block text-xs font-bold text-gray-700">📸 課題の証拠写真・動画・報告コメント</label>
              <textarea
                rows={2}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="課題をこなした感想や報告を入力..."
                className="w-full p-3 border rounded-lg text-xs sm:text-sm bg-gray-50/50"
              />
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5">
                    📸 撮影する
                    <input type="file" accept="image/*,video/*" capture="environment" onChange={handlePostFileChange} className="hidden" />
                  </label>
                  <label className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border shadow-sm flex items-center gap-1.5">
                    📁 ファイル選択
                    <input type="file" accept="image/*,video/*" onChange={handlePostFileChange} className="hidden" />
                  </label>
                  {postPreview && (
                    <img src={postPreview} alt="プレビュー" onClick={() => setModalImageUrl(postPreview)} className="w-10 h-10 object-cover rounded-lg border cursor-pointer" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-end items-center pt-2">
            <button
              type="button"
              onClick={handleOpenSendModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition"
            >
              課題を提出
            </button>
            <button onClick={handleShareX} className="px-4 py-2.5 bg-black text-white text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1.5">
              Xで報告
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">カテゴリ別ボトルシート一覧（スワイプ対応）</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parentCategories.map((parent) => {
                const subCats = getSubCategories(parent.id)
                const allChildItems = subCats.flatMap((sub) => getChildItems(sub.id))
                
                const ITEMS_PER_PAGE = 35
                const totalPages = Math.max(1, Math.ceil(allChildItems.length / ITEMS_PER_PAGE))
                const currentPage = categoryPages[parent.id] || 0
                const safePage = Math.min(currentPage, totalPages - 1)

                const startIndex = safePage * ITEMS_PER_PAGE
                const pageItems = allChildItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
                const gridItems = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => pageItems[index] || null)

                const sheetKey = `${parent.id}-p${safePage}`

                return (
                  <div key={parent.id} className="border p-3.5 rounded-xl bg-white shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <h3 className="font-bold text-indigo-700 text-xs sm:text-sm">
                        {parent.title} {totalPages > 1 && `(${safePage + 1}/${totalPages}ページ)`}
                      </h3>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const ref = sheetRefs.current[sheetKey]
                            if (ref) {
                              toPng(ref, { pixelRatio: 3, backgroundColor: '#ffffff' }).then((url) => setModalImageUrl(url))
                            }
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded shadow transition border"
                        >
                          🔍 拡大
                        </button>
                        <button
                          onClick={() => handleDownloadSheet(sheetKey, parent.title, safePage)}
                          disabled={exportingKey === sheetKey}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded shadow transition"
                        >
                          {exportingKey === sheetKey ? '保存中...' : `保存(P${safePage + 1})`}
                        </button>
                      </div>
                    </div>

                    <div
                      onTouchStart={(e) => {
                        touchStartRef.current[parent.id] = e.touches[0].clientX
                      }}
                      onTouchEnd={(e) => {
                        const startX = touchStartRef.current[parent.id]
                        if (startX === undefined) return
                        const endX = e.changedTouches[0].clientX
                        const diff = startX - endX

                        if (Math.abs(diff) > 50) {
                          if (diff > 0 && safePage < totalPages - 1) {
                            setCategoryPages((prev) => ({ ...prev, [parent.id]: safePage + 1 }))
                          } else if (diff < 0 && safePage > 0) {
                            setCategoryPages((prev) => ({ ...prev, [parent.id]: safePage - 1 }))
                          }
                        }
                      }}
                      ref={(el) => { sheetRefs.current[sheetKey] = el }}
                      className="w-full bg-white p-4 rounded-lg border space-y-4 cursor-pointer select-none"
                      onClick={() => {
                        const ref = sheetRefs.current[sheetKey]
                        if (ref) {
                          toPng(ref, { pixelRatio: 3, backgroundColor: '#ffffff' }).then((url) => setModalImageUrl(url))
                        }
                      }}
                      title="クリックして拡大表示"
                    >
                      <div className="border-b pb-2.5 flex justify-between items-center">
                        <div>
                          <h2 className="text-xs font-extrabold text-gray-950">KINK BOTTLE SHEET ({parent.title}) {totalPages > 1 && `- P.${safePage + 1}`}</h2>
                          <p className="text-[9px] text-gray-400">@{profile.username || 'My Jar'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] sm:text-[9px]">
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block shrink-0"></span> 興味あり</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 bg-yellow-500 rounded-full inline-block shrink-0"></span> 好きなプレイ</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 bg-green-500 rounded-full inline-block shrink-0"></span> 経験あり</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 bg-pink-500 rounded-full inline-block shrink-0"></span> 大好物</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 bg-purple-500 rounded-full inline-block shrink-0"></span> 所持</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2.5 pt-1">
                        {gridItems.map((item, index) => {
                          const itemChecks = item ? checks[item.id] || [] : []
                          const orderedStatuses = ['interested', 'favorite_play', 'experienced', 'favorite', 'owned']
                          const activeSelectedStatuses = orderedStatuses.filter((s) => itemChecks.includes(s))

                          return (
                            <div key={item ? item.id : `empty-${index}`} className="flex flex-col items-center space-y-1">
                              <div className="relative w-9 h-12 sm:w-10 sm:h-14 flex flex-col items-center">
                                <div className="w-4 h-1.5 bg-gray-300 border border-gray-500 rounded-sm z-20"></div>
                                <div className="w-5.5 h-1 bg-gray-400 border border-gray-600 rounded-sm z-20"></div>

                                <div className="relative w-9 sm:w-10 h-9.5 sm:h-11 border border-gray-700 rounded-b-xl rounded-t-md overflow-hidden bg-white/40 flex flex-col justify-end z-10">
                                  {item && (
                                    <div className="absolute inset-0 flex flex-col justify-end z-0">
                                      {activeSelectedStatuses.map((statusKey) => (
                                        <div
                                          key={statusKey}
                                          className="w-full flex-1"
                                          style={{ backgroundColor: STATUS_COLORS[statusKey].color }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <div className="absolute top-1 left-1 w-1 h-7 bg-white/60 rounded-full blur-[1px] z-20 pointer-events-none"></div>
                                </div>
                              </div>

                              <div className={`w-full text-center pt-0.5 ${item ? 'border-t border-gray-900' : 'border-t border-transparent'}`}>
                                <span className="text-[8px] sm:text-[9px] font-semibold text-gray-800 line-clamp-2 block leading-tight min-h-[22px]">
                                  {item ? item.title : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center px-1 pt-1 text-xs">
                        <button
                          onClick={() => setCategoryPages((prev) => ({ ...prev, [parent.id]: Math.max(0, safePage - 1) }))}
                          disabled={safePage === 0}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded font-bold text-gray-700"
                        >
                          ◀ 前へ
                        </button>
                        <span className="text-gray-500 font-medium text-[11px]">
                          {safePage + 1} / {totalPages} ページ（スワイプ切替可）
                        </span>
                        <button
                          onClick={() => setCategoryPages((prev) => ({ ...prev, [parent.id]: Math.min(totalPages - 1, safePage + 1) }))}
                          disabled={safePage === totalPages - 1}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded font-bold text-gray-700"
                        >
                          次へ ▶
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <FeedbackFooter />
        </section>
      )}
    </main>
  )
}