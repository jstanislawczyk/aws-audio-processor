resource "aws_sfn_state_machine" "audio_processor" {
  name     = "audio-processor"
  role_arn = aws_iam_role.audio_processor.arn

  definition = <<EOF
{
  "Comment": "Audio Processor State Machine that transcribes audio files to text and transforms them to common format.",
  "StartAt": "Wait",
  "States": {
    "Wait": {
      "Type": "Wait",
      "Seconds": 1,
      "End": true
    }
  }
}
EOF
}

resource "aws_iam_role" "audio_processor" {
  name               = "audio-processor"
  assume_role_policy = data.aws_iam_policy_document.audio_processor_policy.json
}

data "aws_iam_policy_document" "audio_processor_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

