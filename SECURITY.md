# 🔒 Security Guide

## API Key Management

### ✅ Current Security Measures
- `.env` file excluded from git via `.gitignore`
- No API keys committed to version control
- Example environment file (`.env.example`) provided
- All API communication over HTTPS
- Keys loaded via environment variables

### 🚨 Before Making Repository Public

**CRITICAL STEPS:**
1. **Revoke existing API keys** from your accounts:
   - ElevenLabs: https://elevenlabs.io/app/settings/api-keys
   - Google AI Studio: https://aistudio.google.com/app/apikey

2. **Generate new API keys** after making the repo public

3. **Verify no keys in git history:**
   ```bash
   git log --all --full-history -- .env
   git show --name-only --oneline --all | grep -E "(sk_|AIza)"
   ```

### 🔐 API Key Security Best Practices

#### ElevenLabs API Keys
- **Format**: `sk_[40+ characters]`
- **Storage**: Environment variables only
- **Rotation**: Regenerate monthly
- **Permissions**: Minimum required scope

#### Google Gemini API Keys
- **Format**: `AIza[35+ characters]`
- **Storage**: Environment variables only
- **Restrictions**: IP/domain restrictions when possible
- **Quotas**: Set usage limits

## Development Security

### Local Development
```bash
# Never commit these files:
.env
.env.local
.env.*.local

# Always use:
.env.example  # Template file (safe to commit)
```

### Production Deployment
- Use platform-specific secret management
- Rotate keys regularly
- Monitor API usage for anomalies
- Enable rate limiting

## Data Privacy

### User Data
- **Books**: Stored locally on device
- **Generated Content**: Cached locally
- **API Calls**: Direct to service providers
- **No Telemetry**: Zero data collection

### Third-Party APIs
- **ElevenLabs**: Text sent for voice generation
- **Google Gemini**: Prompts sent for image generation
- Review each provider's data policies

## Security Checklist

Before going public, ensure:

- [ ] No API keys in any file
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` provided
- [ ] All existing keys revoked
- [ ] New keys generated post-publication
- [ ] Security documentation complete
- [ ] README includes security warnings

## Incident Response

If API keys are accidentally exposed:
1. **Immediately revoke** exposed keys
2. **Generate new keys** 
3. **Update applications** with new keys
4. **Monitor accounts** for unauthorized usage
5. **Review git history** for other potential exposures

## Contact

For security concerns, create an issue with the "security" label.