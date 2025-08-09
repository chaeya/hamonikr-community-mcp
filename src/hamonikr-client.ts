import { BrowserManager } from './browser-manager';
import { 
  Config, 
  LoginResult, 
  PostData, 
  PostResult, 
  CommentData, 
  CommentResult,
  EditData,
  DeleteResult,
  HamoniKRSession,
  GetPostResult,
  PostContent
} from './types';

export class HamoniKRClient {
  private browserManager: BrowserManager;
  private config: Config;
  private session: HamoniKRSession = { isLoggedIn: false };

  constructor(config: Config) {
    this.config = config;
    this.browserManager = new BrowserManager(config.browser);
  }

  async login(): Promise<LoginResult> {
    try {
      await this.browserManager.initialize();
      
      // Check if already logged in
      if (await this.checkLoginStatus()) {
        return {
          success: true,
          message: '이미 로그인되어 있습니다.',
          sessionActive: true
        };
      }

      // Navigate to login page
      await this.browserManager.navigateTo(this.config.hamonikr.loginUrl);
      
      // Wait for login form
      const loginFormExists = await this.browserManager.waitForElement(
        'input[name="user_id"], input[type="email"]', 
        10000
      );
      
      if (!loginFormExists) {
        return {
          success: false,
          message: '로그인 폼을 찾을 수 없습니다.'
        };
      }

      // Fill in credentials
      const page = await this.browserManager.getPage();
      
      // Try different possible selectors for email/username field
      const emailSelectors = [
        'input[name="user_id"]',
        'input[type="email"]',
        'input[placeholder*="이메일"]',
        'input[placeholder*="아이디"]'
      ];
      
      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.fill(selector, this.config.hamonikr.credentials.username);
            emailFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!emailFilled) {
        return {
          success: false,
          message: '이메일/아이디 입력 필드를 찾을 수 없습니다.'
        };
      }

      // Fill password
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]'
      ];
      
      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.fill(selector, this.config.hamonikr.credentials.password);
            passwordFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!passwordFilled) {
        return {
          success: false,
          message: '비밀번호 입력 필드를 찾을 수 없습니다.'
        };
      }

      // Click login button
      const loginButtonSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:has-text("로그인")',
        '.login_button',
        '#login_button'
      ];
      
      let loginClicked = false;
      for (const selector of loginButtonSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            loginClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!loginClicked) {
        return {
          success: false,
          message: '로그인 버튼을 찾을 수 없습니다.'
        };
      }

      // Wait for navigation
      await this.browserManager.waitForNavigation();
      
      // Verify login success
      const loginSuccess = await this.checkLoginStatus();
      
      if (loginSuccess) {
        this.session.isLoggedIn = true;
        this.session.username = this.config.hamonikr.credentials.username;
        this.session.lastLoginTime = new Date();
        
        return {
          success: true,
          message: '로그인에 성공했습니다.',
          sessionActive: true
        };
      } else {
        return {
          success: false,
          message: '로그인에 실패했습니다. 자격 증명을 확인해주세요.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `로그인 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  async checkLoginStatus(): Promise<boolean> {
    try {
      const page = await this.browserManager.getPage();
      
      // Check for logout link/button or user profile indicators
      const loginIndicators = [
        'a:has-text("로그아웃")',
        'a[href*="logout"]',
        '.user-profile',
        '.member-info',
        'a:has-text("회원정보")'
      ];
      
      for (const selector of loginIndicators) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login status check failed:', error);
      return false;
    }
  }

  async createPost(postData: PostData): Promise<PostResult> {
    try {
      // Ensure we're logged in
      const loginResult = await this.login();
      if (!loginResult.success) {
        return {
          success: false,
          message: `로그인 실패: ${loginResult.message}`
        };
      }

      // Navigate to appropriate board
      const boardUrl = postData.board === 'notice' 
        ? this.config.hamonikr.boards.notice 
        : this.config.hamonikr.boards.qna;
      
      await this.browserManager.navigateTo(boardUrl);

      // Find and click "쓰기" button
      const page = await this.browserManager.getPage();
      
      const writeButtonSelectors = [
        'a:has-text("쓰기")',
        'button:has-text("쓰기")',
        '.write-button',
        'a[href*="Write"]'
      ];
      
      let writeButtonClicked = false;
      for (const selector of writeButtonSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            writeButtonClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!writeButtonClicked) {
        return {
          success: false,
          message: '글쓰기 버튼을 찾을 수 없습니다.'
        };
      }

      await this.browserManager.waitForNavigation();

      // Fill in title
      const titleSelectors = [
        'input[name="title"]',
        'input[placeholder*="제목"]',
        '#title'
      ];
      
      let titleFilled = false;
      for (const selector of titleSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.fill(selector, postData.title);
            titleFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!titleFilled) {
        return {
          success: false,
          message: '제목 입력 필드를 찾을 수 없습니다.'
        };
      }

      // Fill in content
      const contentSelectors = [
        'textarea[name="content"]',
        'textarea[placeholder*="내용"]',
        '#content',
        '.editor-content'
      ];
      
      let contentFilled = false;
      for (const selector of contentSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.fill(selector, postData.content);
            contentFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!contentFilled) {
        return {
          success: false,
          message: '내용 입력 필드를 찾을 수 없습니다.'
        };
      }

      // Submit the post
      const submitSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:has-text("등록")',
        'button:has-text("저장")',
        '.submit-button'
      ];
      
      let submitClicked = false;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            submitClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitClicked) {
        return {
          success: false,
          message: '등록 버튼을 찾을 수 없습니다.'
        };
      }

      await this.browserManager.waitForNavigation();
      
      // Get the final URL to extract post ID
      const finalUrl = await this.browserManager.getCurrentUrl();
      const postId = this.extractPostIdFromUrl(finalUrl);
      
      return {
        success: true,
        message: '게시글이 성공적으로 등록되었습니다.',
        postUrl: finalUrl,
        postId
      };
    } catch (error) {
      return {
        success: false,
        message: `게시글 작성 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  async addComment(commentData: CommentData): Promise<CommentResult> {
    try {
      // Ensure we're logged in
      const loginResult = await this.login();
      if (!loginResult.success) {
        return {
          success: false,
          message: `로그인 실패: ${loginResult.message}`
        };
      }

      // Navigate to the post
      await this.browserManager.navigateTo(commentData.postUrl);
      
      const page = await this.browserManager.getPage();

      // Find comment form
      const commentSelectors = [
        'textarea[placeholder*="댓글"]',
        'input[placeholder*="댓글"]',
        'textbox[name*="댓글"]',
        '.comment-input',
        '#comment_content'
      ];
      
      let commentFilled = false;
      for (const selector of commentSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.fill(selector, commentData.content);
            commentFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!commentFilled) {
        return {
          success: false,
          message: '댓글 입력 필드를 찾을 수 없습니다.'
        };
      }

      // Submit comment
      const submitSelectors = [
        'button:has-text("등록")',
        'input[value="등록"]',
        'button[type="submit"]',
        '.comment-submit'
      ];
      
      let submitClicked = false;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            submitClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitClicked) {
        return {
          success: false,
          message: '댓글 등록 버튼을 찾을 수 없습니다.'
        };
      }

      // Wait a bit for the page to update
      await page.waitForTimeout(2000);
      
      // Check if URL changed (indicating successful comment submission)
      const finalUrl = await this.browserManager.getCurrentUrl();
      const commentId = this.extractCommentIdFromUrl(finalUrl);
      
      return {
        success: true,
        message: '댓글이 성공적으로 등록되었습니다.',
        commentId
      };
    } catch (error) {
      return {
        success: false,
        message: `댓글 작성 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  async editPost(editData: EditData): Promise<PostResult> {
    try {
      // Ensure we're logged in
      const loginResult = await this.login();
      if (!loginResult.success) {
        return {
          success: false,
          message: `로그인 실패: ${loginResult.message}`
        };
      }

      // Navigate to the post
      await this.browserManager.navigateTo(editData.postUrl);
      
      const page = await this.browserManager.getPage();

      // Find and click edit button
      const editButtonSelectors = [
        'a:has-text("수정")',
        'button:has-text("수정")',
        '.edit-button',
        'a[href*="modify"]',
        'a[href*="edit"]'
      ];
      
      let editButtonClicked = false;
      for (const selector of editButtonSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            editButtonClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!editButtonClicked) {
        return {
          success: false,
          message: '수정 버튼을 찾을 수 없습니다.'
        };
      }

      await this.browserManager.waitForNavigation();

      // Update title if provided
      if (editData.title) {
        const titleSelectors = [
          'input[name="title"]',
          'input[placeholder*="제목"]',
          '#title'
        ];
        
        for (const selector of titleSelectors) {
          try {
            const element = await page.$(selector);
            if (element && await element.isVisible()) {
              await page.fill(selector, editData.title);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Update content if provided
      if (editData.content) {
        const contentSelectors = [
          'textarea[name="content"]',
          'textarea[placeholder*="내용"]',
          '#content',
          '.editor-content'
        ];
        
        for (const selector of contentSelectors) {
          try {
            const element = await page.$(selector);
            if (element && await element.isVisible()) {
              await page.fill(selector, editData.content);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Submit the changes
      const submitSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'button:has-text("등록")',
        'button:has-text("저장")',
        'button:has-text("수정")'
      ];
      
      let submitClicked = false;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            submitClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitClicked) {
        return {
          success: false,
          message: '저장 버튼을 찾을 수 없습니다.'
        };
      }

      await this.browserManager.waitForNavigation();
      
      const finalUrl = await this.browserManager.getCurrentUrl();
      
      return {
        success: true,
        message: '게시글이 성공적으로 수정되었습니다.',
        postUrl: finalUrl
      };
    } catch (error) {
      return {
        success: false,
        message: `게시글 수정 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  async getPost(postUrl: string): Promise<GetPostResult> {
    try {
      // Navigate to the post
      await this.browserManager.navigateTo(postUrl);
      
      const page = await this.browserManager.getPage();

      // Extract post information
      const postData: PostContent = {
        title: '',
        content: '',
        author: '',
        date: '',
        views: 0,
        comments: 0,
        url: postUrl
      };

      // Extract title
      const titleSelectors = [
        'h1',
        '.title',
        '.post-title',
        'h2[class*="title"]',
        'h1[class*="title"]'
      ];
      
      for (const selector of titleSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            const titleText = await element.textContent();
            if (titleText && titleText.trim()) {
              postData.title = titleText.trim();
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Extract content
      const contentSelectors = [
        '.post-content',
        '.content',
        'article',
        '.document-content',
        '.xe_content',
        '[class*="content"]'
      ];
      
      for (const selector of contentSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            const contentText = await element.textContent();
            if (contentText && contentText.trim().length > 10) {
              postData.content = contentText.trim();
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Extract author
      const authorSelectors = [
        '.author',
        '.writer',
        '.post-author',
        '[class*="author"]',
        'a[href*="popup_menu_area"]'
      ];
      
      for (const selector of authorSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            const authorText = await element.textContent();
            if (authorText && authorText.trim()) {
              postData.author = authorText.trim();
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Extract date
      const dateSelectors = [
        '.date',
        '.regdate',
        '.post-date',
        '[class*="date"]',
        'time'
      ];
      
      for (const selector of dateSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            const dateText = await element.textContent();
            if (dateText && dateText.trim().match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/)) {
              postData.date = dateText.trim();
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Extract views count
      try {
        const viewsElement = await page.$('[class*="view"], [class*="read"]');
        if (viewsElement) {
          const viewsText = await viewsElement.textContent();
          const viewsMatch = viewsText?.match(/(\d+)/);
          if (viewsMatch) {
            postData.views = parseInt(viewsMatch[1]);
          }
        }
      } catch (e) {
        // Views extraction is optional
      }

      // Extract comments count
      try {
        const commentsElement = await page.$('[class*="comment"]');
        if (commentsElement) {
          const commentsText = await commentsElement.textContent();
          const commentsMatch = commentsText?.match(/(\d+)/);
          if (commentsMatch) {
            postData.comments = parseInt(commentsMatch[1]);
          }
        }
      } catch (e) {
        // Comments extraction is optional
      }

      // Validate that we extracted essential information
      if (!postData.title || !postData.content) {
        return {
          success: false,
          message: '게시글의 필수 정보(제목 또는 내용)를 추출할 수 없습니다.'
        };
      }

      return {
        success: true,
        message: '게시글 내용을 성공적으로 조회했습니다.',
        post: postData
      };
    } catch (error) {
      return {
        success: false,
        message: `게시글 조회 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  async deletePost(postUrl: string): Promise<DeleteResult> {
    try {
      // Ensure we're logged in
      const loginResult = await this.login();
      if (!loginResult.success) {
        return {
          success: false,
          message: `로그인 실패: ${loginResult.message}`
        };
      }

      // Navigate to the post
      await this.browserManager.navigateTo(postUrl);
      
      const page = await this.browserManager.getPage();

      // Find and click delete button
      const deleteButtonSelectors = [
        'a:has-text("삭제")',
        'button:has-text("삭제")',
        '.delete-button',
        'a[href*="delete"]',
        'a[href*="remove"]'
      ];
      
      let deleteButtonClicked = false;
      for (const selector of deleteButtonSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            await page.click(selector);
            deleteButtonClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!deleteButtonClicked) {
        return {
          success: false,
          message: '삭제 버튼을 찾을 수 없습니다.'
        };
      }

      // Handle confirmation dialog if present
      page.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        }
      });

      await this.browserManager.waitForNavigation();
      
      return {
        success: true,
        message: '게시글이 성공적으로 삭제되었습니다.'
      };
    } catch (error) {
      return {
        success: false,
        message: `게시글 삭제 중 오류가 발생했습니다: ${error}`
      };
    }
  }

  private extractPostIdFromUrl(url: string): string | undefined {
    const match = url.match(/document_srl=(\d+)/);
    return match ? match[1] : undefined;
  }

  private extractCommentIdFromUrl(url: string): string | undefined {
    const match = url.match(/#comment_(\d+)/);
    return match ? match[1] : undefined;
  }

  async close(): Promise<void> {
    await this.browserManager.close();
    this.session = { isLoggedIn: false };
  }

  getSession(): HamoniKRSession {
    return { ...this.session };
  }
}