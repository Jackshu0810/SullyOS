import type { APIConfig, ApiPreset, CharacterProfile } from '../types';

/** Resolve a character's primary chat API from its saved preset, falling back to the global API. */
export function resolveCharacterApiConfig(
    character: CharacterProfile | undefined,
    globalApiConfig: APIConfig,
    apiPresets: ApiPreset[],
): APIConfig {
    if (!character?.apiPresetId) return globalApiConfig;
    const preset = apiPresets.find(item => item.id === character.apiPresetId);
    if (!preset) return globalApiConfig;

    // Bind only the primary text API. Vision, speech, and other integration settings remain global.
    return {
        ...globalApiConfig,
        baseUrl: preset.config.baseUrl,
        apiKey: preset.config.apiKey,
        model: preset.config.model,
        stream: preset.config.stream ?? globalApiConfig.stream,
        temperature: preset.config.temperature ?? globalApiConfig.temperature,
    };
}
