# Model paths

--stage1_model
--stage2_model

# Generation parameters

--max_new_tokens (default: 2500)
--repetition_penalty (default: 1.1)
--run_n_segments (default: 2)
--stage2_batch_size (default: 6)

# Required inputs

--genre_txt (required)
--lyrics_txt (required)

# Optional audio prompts

--use_audio_prompt
--audio_prompt_path
--prompt_start_time
--prompt_end_time
--use_dual_tracks_prompt
--vocal_track_prompt_path
--instrumental_track_prompt_path

# Output/config

--output_dir (default: ./output)
--keep_intermediate
--disable_offload_model
--cuda_idx (default: 0)
--seed

# Model configs

--basic_model_config
--resume_path
--config_path
--vocal_decoder_path
--inst_decoder_path
-r (resume flag)
