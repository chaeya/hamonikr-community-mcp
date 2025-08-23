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
        'a:has-text("회원정보")',
        'a:has-text("회원정보 보기")'  // More specific for HamoniKR
      ];
      
      let foundLoginIndicator = false;
      for (const selector of loginIndicators) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            console.log('Found login indicator:', selector);
            foundLoginIndicator = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Also check for login link (if present, means not logged in)
      const loginLink = await page.$('a:has-text("로그인")');
      const hasLoginLink = loginLink && await loginLink.isVisible();
      
      console.log('Login status check - Found indicator:', foundLoginIndicator, 'Has login link:', hasLoginLink);
      
      return foundLoginIndicator && !hasLoginLink;
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
      let boardUrl: string;
      switch (postData.board) {
        case 'notice':
          boardUrl = this.config.hamonikr.boards.notice;
          break;
        case 'qna':
          boardUrl = this.config.hamonikr.boards.qna;
          break;
        case 'project':
          boardUrl = this.config.hamonikr.boards.project;
          break;
        default:
          boardUrl = this.config.hamonikr.boards.qna;
      }
      
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

      // Fill in content - Enhanced support for CKEditor and other rich text editors
      const contentSelectors = [
        'textarea[name="content"]',
        'textarea[placeholder*="내용"]',
        '#content',
        '.editor-content',
        'textarea[name="editor_sequence"]',
        'iframe[name="content___Frame"]', // CKEditor iframe
        '.cke_wysiwyg_frame', // CKEditor frame
        '[contenteditable="true"]', // Contenteditable div
        '.xe_content', // XE content area
        'textarea[id*="editor"]'
      ];
      
      let contentFilled = false;
      
      // First try regular textareas
      for (const selector of contentSelectors) {
        if (selector.includes('iframe') || selector.includes('Frame')) continue;
        
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            // Check if it's a contenteditable element
            if (selector.includes('contenteditable') || await element.getAttribute('contenteditable') === 'true') {
              await element.click();
              await page.keyboard.press('Control+a');
              await page.keyboard.type(postData.content);
            } else {
              await page.fill(selector, postData.content);
            }
            contentFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // If regular methods failed, try CKEditor iframe approach
      if (!contentFilled) {
        try {
          // Wait for CKEditor to load
          await page.waitForTimeout(2000);
          
          // Try to find CKEditor iframe
          const iframeSelectors = [
            'iframe[name*="content"]',
            'iframe[name*="editor"]',
            '.cke_wysiwyg_frame'
          ];
          
          for (const iframeSelector of iframeSelectors) {
            try {
              const iframe = await page.$(iframeSelector);
              if (iframe) {
                const frame = await iframe.contentFrame();
                if (frame) {
                  const bodySelector = 'body';
                  const body = await frame.$(bodySelector);
                  if (body) {
                    await body.click();
                    await body.selectText();
                    await body.type(postData.content);
                    contentFilled = true;
                    break;
                  }
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          // CKEditor approach failed
        }
      }

      // If still not filled, try JavaScript injection
      if (!contentFilled) {
        try {
          const success = await page.evaluate((content) => {
            // Try various CKEditor methods
            if (typeof (window as any).CKEDITOR !== 'undefined') {
              const CKEDITOR = (window as any).CKEDITOR;
              for (const instanceName in CKEDITOR.instances) {
                const instance = CKEDITOR.instances[instanceName];
                if (instance) {
                  instance.setData(content);
                  return true;
                }
              }
            }
            
            // Try tinyMCE
            if (typeof (window as any).tinymce !== 'undefined') {
              const tinymce = (window as any).tinymce;
              const editors = tinymce.get();
              if (editors.length > 0) {
                editors[0].setContent(content);
                return true;
              }
            }
            
            // Try finding contenteditable elements
            const contentEditableElements = document.querySelectorAll('[contenteditable="true"]');
            if (contentEditableElements.length > 0) {
              contentEditableElements[0].innerHTML = content;
              return true;
            }
            
            return false;
          }, postData.content);
          
          if (success) {
            contentFilled = true;
          }
        } catch (e) {
          // JavaScript injection failed
        }
      }

      if (!contentFilled) {
        return {
          success: false,
          message: '내용 입력 필드를 찾을 수 없습니다. 다양한 에디터 형식을 시도했으나 모두 실패했습니다.'
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

      // Wait for submission and navigation
      let navigationSuccessful = false;
      try {
        await this.browserManager.waitForNavigation();
        navigationSuccessful = true;
      } catch (error) {
        console.log('Navigation after submit failed:', error);
        // Continue to check the page state
      }
      
      // Wait a bit more for page to fully load and any error messages to appear
      await page.waitForTimeout(5000);
      
      // Get the final URL to extract post ID
      const finalUrl = await this.browserManager.getCurrentUrl();
      console.log('Final URL after submission:', finalUrl);
      
      // More comprehensive error detection
      // 1. Check if we're still on the write page (indicating failure)
      if (finalUrl.includes('Write') || finalUrl.includes('write') || finalUrl.includes('dispBoardWrite')) {
        console.log('Still on write page, checking for errors...');
        
        // Check for error messages on the page
        let errorMessage = '게시글 등록에 실패했습니다.';
        
        try {
          // Look for various error indicators
          const errorSelectors = [
            '.error',
            '.alert',
            '.message',
            '.warning',
            '[class*="error"]',
            '[class*="alert"]',
            '[class*="fail"]',
            'script:contains("alert")', // JavaScript alerts
            'div:contains("실패")',
            'div:contains("오류")',
            'div:contains("에러")',
            'span:contains("실패")',
            'span:contains("오류")',
            'p:contains("실패")',
            'p:contains("오류")'
          ];
          
          for (const selector of errorSelectors) {
            try {
              const errorElement = await page.$(selector);
              if (errorElement && await errorElement.isVisible()) {
                const errorText = await errorElement.textContent();
                if (errorText && errorText.trim() && 
                    (errorText.includes('실패') || errorText.includes('오류') || 
                     errorText.includes('에러') || errorText.includes('failed') || 
                     errorText.includes('error'))) {
                  errorMessage = errorText.trim();
                  console.log('Found error message:', errorMessage);
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
          
          // Also check page content for common error patterns
          const pageContent = await page.content();
          if (pageContent.includes('특수문자') || pageContent.includes('허용되지 않') || 
              pageContent.includes('금지된') || pageContent.includes('올바르지 않') ||
              pageContent.includes('유효하지 않')) {
            errorMessage = '내용에 허용되지 않는 문자나 형식이 포함되어 있습니다.';
          }
          
        } catch (e) {
          console.log('Error message extraction failed:', e);
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // 2. Check if URL didn't change at all (possible JavaScript error)
      if (!navigationSuccessful) {
        return {
          success: false,
          message: '게시글 제출 중 페이지 이동이 발생하지 않았습니다. 특수문자나 형식 오류가 있을 수 있습니다.'
        };
      }
      
      // 3. Check for error redirect URLs
      if (finalUrl.includes('error') || finalUrl.includes('fail') || finalUrl.includes('denied')) {
        return {
          success: false,
          message: '게시글 등록이 거부되었습니다. 권한이나 내용을 확인해주세요.'
        };
      }
      
      // Extract post ID from successful URL
      const postId = this.extractPostIdFromUrl(finalUrl);
      
      // 4. Verify the post was actually created by checking if we can see content
      try {
        // Wait for post content to load
        await page.waitForTimeout(2000);
        
        // Look for post indicators (title, content, author info, etc.)
        const postIndicators = [
          'h1, .title, .post-title',
          '.post-content, .content, .document-content',
          '.author, .writer, .post-author',
          '.date, .regdate, .post-date'
        ];
        
        let postContentFound = false;
        for (const selector of postIndicators) {
          try {
            const element = await page.$(selector);
            if (element && await element.isVisible()) {
              const text = await element.textContent();
              if (text && text.trim().length > 0) {
                postContentFound = true;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!postContentFound) {
          return {
            success: false,
            message: '게시글이 등록되었지만 내용을 확인할 수 없습니다. 실제로 등록되지 않았을 수 있습니다.'
          };
        }
        
      } catch (e) {
        console.log('Post verification failed:', e);
        // Don't fail here as the URL change indicates likely success
      }
      
      // 5. Final validation: if we have a valid post ID, it's likely successful
      if (!postId) {
        return {
          success: false,
          message: '게시글 URL에서 게시글 ID를 찾을 수 없습니다. 등록이 완료되지 않았을 수 있습니다.'
        };
      }
      
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

      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if we're actually logged in by looking for login indicators
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        // Try to login again
        const retryLogin = await this.login();
        if (!retryLogin.success) {
          return {
            success: false,
            message: `재로그인 실패: ${retryLogin.message}`
          };
        }
        // Navigate back to the post after login
        await this.browserManager.navigateTo(commentData.postUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }

      // Check for login required message in comment area
      const loginRequiredMessage = await page.$('text=댓글 쓰기 권한이 없습니다');
      if (loginRequiredMessage) {
        return {
          success: false,
          message: '로그인이 필요합니다. 현재 세션이 만료되었을 수 있습니다.'
        };
      }

      // First try to activate comment form by clicking "댓글 쓰기"
      try {
        const commentWriteButton = await page.$('text=댓글 쓰기');
        if (commentWriteButton && await commentWriteButton.isVisible()) {
          await commentWriteButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Continue if click fails
      }

      // Find comment form - Enhanced selectors for HamoniKR community
      const commentSelectors = [
        // XE-specific selectors for HamoniKR
        'textarea[name="comment"]',
        'textarea[class*="comment"]',
        '#comment',
        '.comment textarea',
        'form[class*="comment"] textarea',
        '.xe_content textarea',
        
        // Dynamic editor selectors
        'iframe[name*="comment"]',
        '.cke_wysiwyg_frame',
        
        // Original selectors
        'textarea[placeholder*="댓글"]',
        'input[placeholder*="댓글"]',
        'textarea[name="content"]',
        'input[name="comment"]',
        'input[name="content"]', 
        'textbox[name*="댓글"]',
        '.comment-input',
        '#comment_content',
        'textarea[id*="comment"]',
        'input[id*="comment"]',
        '[contenteditable="true"]', // For rich text comment editors
        'textarea[placeholder*="내용을 입력하세요"]',
        'textarea[placeholder*="댓글을 입력"]',
        'textarea[placeholder*="Write a comment"]',
        
        // Generic textarea as last resort
        'textarea'
      ];
      
      let commentFilled = false;
      
      // Wait a bit for dynamic content to load
      await page.waitForTimeout(3000);

      // Debug: Check current page content for comment area
      console.log('Current page URL:', await page.url());
      console.log('Current page title:', await page.title());
      
      // Check for comment elements specifically
      const commentArea = await page.$('.comment, #comment, [class*="comment"]');
      if (commentArea) {
        const commentAreaText = await commentArea.textContent();
        console.log('Found comment area:', commentAreaText?.slice(0, 200));
      }
      
      for (const selector of commentSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            // Check if element is disabled (indicates not logged in)
            const isDisabled = await element.getAttribute('disabled');
            if (isDisabled !== null) {
              continue; // Skip disabled elements
            }
            
            // Check if it's a contenteditable element
            if (selector.includes('contenteditable') || await element.getAttribute('contenteditable') === 'true') {
              await element.click();
              await page.keyboard.press('Control+a');
              await page.keyboard.type(commentData.content);
            } else {
              await page.fill(selector, commentData.content);
            }
            commentFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // If regular method failed, try using role-based selectors (for accessibility)
      if (!commentFilled) {
        try {
          const roleSelectors = [
            '[role="textbox"]',
            'textarea[role="textbox"]',
            'input[role="textbox"]'
          ];
          
          for (const selector of roleSelectors) {
            try {
              const element = await page.$(selector);
              if (element && await element.isVisible()) {
                const placeholder = await element.getAttribute('placeholder');
                const name = await element.getAttribute('name');
                
                // Check if it seems like a comment field
                if (placeholder?.includes('댓글') || name?.includes('comment') || name?.includes('content')) {
                  await page.fill(selector, commentData.content);
                  commentFilled = true;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          // Role-based approach failed
        }
      }

      if (!commentFilled) {
        // Take a screenshot for debugging
        try {
          const screenshot = await this.browserManager.screenshot('./debug_comment_page.png');
          console.log('Debug screenshot saved to ./debug_comment_page.png');
        } catch (e) {
          console.log('Failed to take debug screenshot:', e);
        }
        
        // Get page content for debugging
        const pageContent = await page.content();
        const hasTextarea = pageContent.includes('<textarea');
        const hasCommentKeyword = pageContent.includes('댓글');
        const hasLoginKeyword = pageContent.includes('로그인');
        
        return {
          success: false,
          message: `댓글 입력 필드를 찾을 수 없습니다. 페이지 분석: textarea=${hasTextarea}, 댓글키워드=${hasCommentKeyword}, 로그인키워드=${hasLoginKeyword}`
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