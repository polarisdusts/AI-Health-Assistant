# Write Python script to file first
$pyScript = @'
# -*- coding: utf-8 -*-
import sys

# Read the existing file to extract template
content = open("C:/Users/23378/Documents/text1/frontend/src/components/PlanGenerator.vue", "r", encoding="utf-8").read()

idx_tpl = content.find("<template>")
idx_tpl_end = content.find("</template>")
idx_style = content.find("<style")

template = content[idx_tpl:idx_tpl_end + 11]
style = content[idx_style:]

# Build the complete new file
full = template + """

""" + style

open("C:/Users/23378/Documents/text1/frontend/src/components/PlanGenerator.vue", "w", encoding="utf-8").write(full)
print("Written OK, length:", len(full))
