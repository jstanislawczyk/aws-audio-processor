resource "aws_sns_topic" "audio_processing_finished" {
  name = "${local.project}-audio-processing-events"
}

resource "aws_sns_topic_subscription" "email_subscription" {
  endpoint  = "Replace with your email address"
  protocol  = "email"
  topic_arn = aws_sns_topic.audio_processing_finished.arn
}
