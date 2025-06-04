import axios, { AxiosInstance } from 'axios';
import { GameContext, OllamaRequest, OllamaResponse, QuestionType } from '../types/GameTypes';

export class OllamaClient {
  private client: AxiosInstance;
  private model: string;
  private context: number[] = [];

  constructor(model: string = 'qwen2.5:7b', baseURL: string = '/api/ollama') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.model = model;
  }

  /**
   * 質問タイプを自動検出
   */
  detectQuestionType(question: string): QuestionType {
    const lowerQuestion = question.toLowerCase();

    // 🎯 複雑性削減: 各パターンを個別メソッドに分離
    if (this.isEvidencePattern(lowerQuestion)) return QuestionType.EVIDENCE;
    if (this.isDirectAttackPattern(lowerQuestion)) return QuestionType.DIRECT_ATTACK;
    if (this.isPsychologicalPattern(lowerQuestion)) return QuestionType.PSYCHOLOGICAL;
    if (this.isEmotionalPattern(lowerQuestion)) return QuestionType.EMOTIONAL;
    if (this.isLogicalPattern(lowerQuestion)) return QuestionType.LOGICAL;
    if (this.isGentlePattern(lowerQuestion)) return QuestionType.GENTLE;

    return QuestionType.LOGICAL;
  }

  private isEvidencePattern(question: string): boolean {
    return question.includes('証拠') || question.includes('これを見て') ||
      question.includes('記録') || question.includes('データ');
  }

  private isDirectAttackPattern(question: string): boolean {
    return question.includes('やったのは') || question.includes('犯人は') ||
      question.includes('お前が') || question.includes('あなたが');
  }

  private isPsychologicalPattern(question: string): boolean {
    return question.includes('被害者') || question.includes('苦しみ') ||
      question.includes('どう思う') || question.includes('気持ち');
  }

  private isEmotionalPattern(question: string): boolean {
    return question.includes('家族') || question.includes('愛する') ||
      question.includes('未来') || question.includes('後悔');
  }

  private isLogicalPattern(question: string): boolean {
    return question.includes('矛盾') || question.includes('説明') ||
      question.includes('なぜ') || question.includes('理由');
  }

  private isGentlePattern(question: string): boolean {
    return question.includes('大丈夫') || question.includes('休憩') ||
      question.includes('水') || question.includes('体調');
  }

  /**
   * AI犯人の応答を生成
   */
  async generateResponse(
    gameContext: GameContext,
    playerQuestion: string,
    questionType: QuestionType
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(gameContext, playerQuestion, questionType);

      const request: OllamaRequest = {
        model: this.model,
        prompt,
        stream: false,
        context: this.context,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          seed: Date.now(),
        },
      };

      const response = await this.client.post<OllamaResponse>('/api/generate', request);

      if (response.data.context) {
        this.context = response.data.context;
      }

      return response.data.response.trim();
    } catch (error) {
      // 🔒 セキュリティリスク除去: エラー詳細を隠蔽
      const errorMessage = error instanceof Error ? error.message : 'API接続エラー';

      // 開発環境でのみデバッグ情報を出力
      if (process.env.NODE_ENV === 'development') {
        console.warn('Ollama API error:', errorMessage);
      }

      // フォールバック応答を返す
      return this.getFallbackResponse(gameContext.currentPhase);
    }
  }

  /**
   * 動的プロンプト構築
   */
  private buildPrompt(
    gameContext: GameContext,
    playerQuestion: string,
    questionType: QuestionType
  ): string {
    const { suspect, currentStatus, currentPhase, conversationHistory } = gameContext;

    // 基本的な犯人設定
    let prompt = `あなたは${suspect.name}という${suspect.age}歳の${suspect.occupation}です。
${suspect.crime}の容疑で取り調べを受けています。
動機は「${suspect.motive}」ですが、まだ認めていません。
性格: ${suspect.personality}
弱点: ${suspect.secretWeakness}（隠している）

現在の心理状態:
- 精神力: ${currentStatus.mentalLife}%
- 警戒度: ${currentStatus.alertLevel}%
- 信頼度: ${currentStatus.trustLevel}%
- 自供意欲: ${currentStatus.confessionRate}%

`;

    // フェーズ別の演技指示
    switch (currentPhase) {
      case 1: // 余裕期
        prompt += `【演技指示】冷静で否認的な態度を保ってください。証拠を要求し、時には弁護士を呼ぶことをほのめかしてください。`;
        break;
      case 2: // 動揺期
        prompt += `【演技指示】動揺し始めています。言葉に詰まったり、記憶が曖昧になったりします。時々感情的になってください。`;
        break;
      case 3: // 混乱期
        prompt += `【演技指示】混乱して不安定です。時々真実を漏らしそうになりますが、まだ完全には認めません。感情的で支離滅裂になることがあります。`;
        break;
      case 4: // 崩壊期
        prompt += `【演技指示】精神的に崩壊寸前です。もう隠し通せないと感じています。涙を流したり、助けを求めたり、部分的に真実を話し始めてください。`;
        break;
    }

    // 質問タイプへの反応指示
    prompt += `\n\n【質問タイプ】${this.getQuestionTypeDescription(questionType)}
この質問タイプに応じて、適切に反応してください。

`;

    // 会話履歴（最新5つ）
    if (conversationHistory.length > 0) {
      prompt += '【これまでの会話】\n';
      const recentHistory = conversationHistory.slice(-5);
      recentHistory.forEach(entry => {
        prompt += `${entry.role === 'player' ? '刑事' : '容疑者'}: ${entry.message}\n`;
      });
    }

    prompt += `\n刑事の質問: ${playerQuestion}\n\n`;
    prompt += `上記の設定と心理状態に基づいて、${suspect.name}として自然に応答してください。
応答は日本語で、1-3文程度で簡潔に。感情表現（「...」「！」など）を適切に使ってください。`;

    return prompt;
  }

  /**
   * 質問タイプの説明取得
   */
  private getQuestionTypeDescription(type: QuestionType): string {
    switch (type) {
      case QuestionType.DIRECT_ATTACK:
        return '直接的な糾弾 - 強く否定するか、精神力が低い場合は動揺してください';
      case QuestionType.PSYCHOLOGICAL:
        return '心理的圧迫 - 良心の呵責を感じ、内面的な葛藤を見せてください';
      case QuestionType.LOGICAL:
        return '論理的追求 - 矛盾を指摘された場合、言い訳を考えるか混乱してください';
      case QuestionType.EMOTIONAL:
        return '感情的訴求 - 感情に訴えられ、心が揺れ動いてください';
      case QuestionType.EVIDENCE:
        return '証拠提示 - 証拠を突きつけられ、大きく動揺してください';
      case QuestionType.GENTLE:
        return '優しい質問 - 警戒を少し緩め、人間的な反応を見せてください';
      default:
        return '通常の質問';
    }
  }

  /**
   * フォールバック応答（Ollama接続エラー時）
   */
  private getFallbackResponse(phase: number): string {
    const responses: Record<number, string[]> = {
      1: [
        "私は何も知りません。",
        "証拠があるなら見せてください。",
        "弁護士を呼びたいです。",
        "なぜ私が疑われるんですか？"
      ],
      2: [
        "...そんなことは...",
        "ちょっと待ってください、それは...",
        "記憶が...はっきりしません。",
        "なぜそんなことを聞くんですか！"
      ],
      3: [
        "わからない...わからないんです！",
        "やめて...もう...",
        "本当に...でも私は...",
        "どうすればいいんですか..."
      ],
      4: [
        "もう...無理です...",
        "すみません...本当に...",
        "...認めます...",
        "助けてください..."
      ]
    };

    // 🔒 型安全性確保: 明示的なフォールバック処理
    const defaultResponses = [
      "私は何も知りません。",
      "証拠があるなら見せてください。"
    ];

    const phaseResponses = responses[phase] || defaultResponses;
    return phaseResponses[Math.floor(Math.random() * phaseResponses.length)]!;
  }

  /**
   * モデル変更
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * コンテキストリセット
   */
  resetContext(): void {
    this.context = [];
  }
}